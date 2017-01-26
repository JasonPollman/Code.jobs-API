import _ from 'lodash';
import debuggr from 'debug';
import { MongoClient } from 'mongodb';
import * as commands from './commands';
import constants from '../../../lib/constants';

const debug = debuggr(`api-mongo-driver-${process.pid}`);

// Promisified mongo functions
const mongoConnect = Promise.promisify(MongoClient.connect);

/**
 * Used to spread into Object.defineProperties.
 * @type {object<boolean>}
 */
const descriptor = {
  configurable: false,
  writable: false,
  enumerable: true,
};

/**
 * A driver for MongoDB.
 * @class MongoDriver
 * @export
 */
export class MongoDriver {
  /**
   * Creates an instance of MongoDriver.
   */
  constructor() {
    Object.defineProperties(this, {
      // A set of promises for caching purposes.
      promises: {
        ...descriptor,
        value: {},
      },
    });
  }

  /**
   * Starts the mongodb client.
   * @returns {object} The mongo db connection handler.
   */
  async connect() {
    if (this.promises.connection) return await this.promises.connection;

    this.promises.connection = (async () => {
      const { HOST, PORT, USER, PASS, DB } = constants.DATA;

      const uri = `mongodb://${USER}:${PASS}@${HOST.replace(/^mongodb:\/\//, '')}`;
      const url = `${uri}:${PORT}/${DB}`;

      debug('Connecting to database using connection string %s', url);
      this.connection = await mongoConnect(url);
      return this.connection;
    })();

    return await this.promises.connection;
  }

  /**
   * Closes the db client
   * @returns {MongoDriver} The current MongoDriver instance.
   */
  async disconnect() {
    if (!this.connection) return this;
    await this.connection.close();
    this.connection = null;
    return this;
  }

  /**
   * Executes a database command.
   * @param {string} key The name of the command to execute.
   * @param {object} data The data to pass to the command.
   * @returns {any} Result of the command execution.
   */
  async exec(key, data = {}) {
    if (!commands[key]) throw new Error(`Key "${key}" doesn't exist.`);
    if (!_.isPlainObject(data)) throw new Error('Argument for parameter "data" must be an object!');

    await this.connect();
    debug('Executing database command %s', key);
    return (await commands[key](this.connection, data, this) || null);
  }
}

/**
 * Exports a singleton by default.
 * @type {MongoDriver}
 */
export default new MongoDriver();
