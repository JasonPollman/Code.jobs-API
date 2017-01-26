import redis from 'redis';
import debuggr from 'debug';
import { md5 } from './utils';
import constants from './constants';

const debug = debuggr(`api-redis-${process.pid}`);

/**
 * Used to spread into Object.defineProperties.
 * @type {object<boolean>}
 */
const descriptor = {
  configurable: false,
  writable: false,
  enumerable: true,
};

export class RedisManager {
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
      // A set of keys for determining a cache key prefix
      prefixes: {
        ...descriptor,
        value: {},
      },
      // The redis connection handler
      connection: {
        ...descriptor,
        writable: true,
        value: null,
      },
    });
  }

  /**
   * Connects to the redis server.
   * @returns {object} The redis connection handle.
   */
  async connect() {
    if (this.promises.connection) return await this.promises.connection;

    this.promises.connection = (async () => {
      this.connection = redis.createClient(constants.REDIS.PORT, constants.REDIS.HOST);
      return this.connection;
    })();

    return await this.promises.connection;
  }

  /**
   * A wrapper around redis.get
   * @param {string} key The key to get the document with.
   * @returns {any} The document value or undefined.
   */
  async get(key) {
    debug('Retrieving redis cache with key %s', key);
    return new Promise((resolve, reject) => this.connection.get(key, (err, results) =>
      (err ? reject(err) : resolve(JSON.parse(results)))));
  }

  /**
   * A wrapper around redis.set
   * @param {string} key The value to key the document with.
   * @param {any} value The value to store.
   * @returns {undefined}
   */
  async set(key, data) {
    debug('Setting redis cache for with %s', key);
    return new Promise((resolve, reject) =>
      this.connection.set(key, JSON.stringify(data), err => (err ? reject(err) : resolve())));
  }

  /**
   * A wrapper around redis.set
   * @param {string} key The value to key the document with.
   * @param {any} value The value to store.
   * @returns {undefined}
   */
  async forget(key) {
    debug('Forgetting redis cache with key %s', key);
    return new Promise((resolve, reject) =>
      this.connection.del(key, err => (err ? reject(err) : resolve())));
  }

  /**
   * Returns the prefix for the specified type.
   * @param {string} type The type to get the prefix for.
   * @returns {string} The prefix for the given type.
   */
  prefix(type) {
    return this.prefixes[type];
  }

  /**
   * Returns the gey for the given type/value pair.
   * @param {string} type The "type" of the item.
   * @param {string|number} id A key identifier for the given type.
   * @returns {string} An md5 key for caching.
   */
  key(type, id) {
    if (!this.prefixes[type]) this.prefixes[type] = type;
    return md5(`${this.prefixes[type]}:${id}`);
  }
}

export default new RedisManager();
