import { EventEmitter } from 'events';
import mysql from 'mysql';
import _ from 'lodash';
import debuggr from 'debug';
import cluster from 'cluster';
import constants from '../../lib/constants';

const has = Object.prototype.hasOwnProperty;
const { DATA_LAYER } = constants;
const debug = debuggr(`api:mysql:${cluster.isMaster ? 'master' : 'worker'}:${process.pid}`);

/**
 * Used to privatize members of the MySQLDriver class.
 * @type {symbol}
 */
const ps = Symbol();

/**
 * Used to spread into Object.defineProperties.
 * @type {object<boolean>}
 */
const descriptor = { configurable: false, enumerable: false, writable: false };

/**
 * Used to spread into database query objects.
 * @type {object<any>}
 */
const DEFAULT_QUERY_VALUES = Object.freeze({ database: 'codejobs', total: 1e6, order: 'asc' });

/**
 * Validates a query's input data object.
 * @param {object} object The data object to validate.
 * @throws {TypeError} If the object isn't an object, the SQL statement doesn't exist, or if
 * values isn't an object.
 * @returns {object} A new object, with the default keys merged with the original object's keys.
 * @export
 */
export function checkQueryOptions(object) {
  // Must provide a plain js object
  if (!_.isPlainObject(object)) throw new TypeError('Query object must be a plain object!');
  const { timeout } = object;
  return { timeout: parseInt(timeout || 3000, 10), ...object };
}

/**
 * Used by the MySQL connection to format (and escape) query objects.
 * In our case, replacing :[key] and @[key] with the corresponding values of "data".
 * @param {string} statement The SQL statement to format.
 * @param {object<any>} data The key/value pairs to replace within the SQL statement.
 * @returns {string} The formatted query.
 * @export
 */
export function formatter(statement, data) {
  if (!data) return statement;

  const escaped = statement
    .replace(/:(\w+)/g, ($0, $1) => (has.call(data, $1) ? this.escape(data[$1]) : $0))
    .replace(/@(\w+)/g, ($0, $1) => (has.call(data, $1) ? this.escapeId(data[$1]) : $0))
    .replace(/!(\w+)/g, ($0, $1) => (has.call(data, $1) ? data[$1] : $0));

  debug('Executing statement: %O', escaped);
  return escaped;
}

/**
 * Merges query data with the default query data.
 * @param {...object} objects The objects to merge.
 * @returns {object} The merged objects.
 * @export
 */
export function mergeValues(...objects) {
  objects.forEach((object) => {
    if (!_.isPlainObject(object)) throw new TypeError('Query values must be a plain object!');
  });

  return Object.assign({}, DEFAULT_QUERY_VALUES, ...objects);
}

/**
 * An "driver" for the data layer. This is an abstraction around the mysql module and executing
 * queries, made for changing out modules easily.
 * @class MySQL
 * @extends {EventEmitter}
 * @export
 */
export class MySQLDriver extends EventEmitter {
  constructor() {
    super();

    // Create a connection pool
    const pool = mysql.createPool({
      host: DATA_LAYER.HOST,
      port: DATA_LAYER.PORT,
      user: DATA_LAYER.USER,
      password: DATA_LAYER.PASS,
      database: DATA_LAYER.DB,
      connectionLimit: DATA_LAYER.MAX_POOL_SIZE || 50,
    });

    Object.defineProperties(this, {
      name: { ...descriptor, value: 'MySQLDriver' },
      pool: { ...descriptor, value: pool },
      [ps]: { ...descriptor, value: {} },
    });
  }

  /**
   * Initializes this MySQLDriver instance.
   * @returns {MySQLDriver} The current MySQLDriver instance.
   * @memberof MySQLDriver
   */
  async connect() {
    if (this[ps].initializationPromise) return await this[ps].initializationPromise;
    debug('Connecting mysql @%s:%s', DATA_LAYER.HOST, DATA_LAYER.PORT);
    return await this[ps].initializationPromise;
  }

  /**
   * Disconnects this MySQLDriver instance.
   * @returns {MySQLDriver} The current MySQLDriver instance.
   * @memberof MySQLDriver
   */
  async disconnect() {
    if (!this[ps].initializationPromise) return this;
    debug('Disconnecting mysql @%s:%s', DATA_LAYER.HOST, DATA_LAYER.PORT);
    this[ps].initializationPromise = null;

    return await new Promise((resolve, reject) =>
      this.pool.end(err => (err ? reject(err) : resolve())));
  }

  /**
   * Executes a database statement.
   * @param {MySQLConnection} db The MySQL connection handle.
   * @param {object} options The options (as formatted by the checkQueryOptions function).
   * @returns {object} The results of query execution.
   * @export
   */
  async execute(sql, values, includeFields = false) {
    // Validate/coerce query options
    const options = checkQueryOptions({ sql, values });

    // Grab a connection from the connection pool
    const connection = await new Promise((resolve, reject) =>
      this.pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn))));

    connection.config.queryFormat = formatter;
    let payload;

    try {
      payload = await new Promise((resolve, reject) =>
        connection.query(options, (err, rows, fields) =>
          (err ? reject(err) : resolve(includeFields ? { rows, fields } : rows))));
    } catch (e) {
      if (constants.NODE_ENV !== 'production') throw e;
      const error = new Error('Bad Request');
      error.status = 400;
      throw error;
    }

    // Release the connection and return the results
    connection.release();
    return payload || null;
  }
}

/**
 * Exports a singleton instance of the MySQL class.
 * @type {MySQL}
 */
export default new MySQLDriver();
