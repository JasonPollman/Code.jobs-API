import redis from 'redis';
import debuggr from 'debug';
import cluster from 'cluster';
import constants from './constants';
import { IMMUTABLE_VISIBLE } from './utils';

const debug = debuggr(`api:redis:${cluster.isMaster ? 'master' : 'worker'}:${process.pid}`);

// Add async promisified methods to the redis library
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

/**
 * Serializes values in preparation for storing in redis.
 * @param {any} value The value to serialize.
 * @returns {string} The serialized value.
 */
function serialize(value) {
  return JSON.stringify(value);
}

/**
 * Deerializes values after fetching them from redis.
 * @param {any} value The value to deserialize.
 * @returns {any} The deserialized value.
 */
function deserialize(value) {
  return JSON.parse(value);
}

export class RedisManager {
  /**
   * Creates an instance of MongoDriver.
   */
  constructor() {
    Object.defineProperties(this, {
      // A set of promises for caching purposes.
      promises: {
        ...IMMUTABLE_VISIBLE,
        value: {},
      },
      // The redis client handler
      client: {
        ...IMMUTABLE_VISIBLE,
        writable: true,
        value: null,
      },
    });
  }

  /**
   * Connects to the redis server.
   * @returns {object} The redis client handle.
   */
  async connect() {
    if (this.promises.client) return await this.promises.client;

    debug('Connecting to redis client @%s:%s', constants.REDIS.HOST, constants.REDIS.PORT);
    this.promises.client = (async () => {
      this.client = redis.createClient(constants.REDIS.PORT, constants.REDIS.HOST);
      return this.client;
    })();

    return await this.promises.client;
  }

  /**
   * A wrapper around redis.get
   * @param {string} key The key to get the document with.
   * @returns {any} The document value or undefined.
   */
  async get(key) {
    debug('Retrieving redis cache with key %O', key);
    const cached = deserialize(await this.client.getAsync(key));
    debug('Cache %s for key %s: %O', cached ? 'HIT' : 'MISS', key, cached);
    return cached || undefined;
  }

  /**
   * A wrapper around redis.set
   * @param {string} key The value to key the document with.
   * @param {any} value The value to store.
   * @returns {undefined}
   */
  async set(key, data) {
    debug('Setting redis cache for with %O', key);
    return await this.client.setAsync(key, serialize(data));
  }

  /**
   * A wrapper around redis.del
   * @param {...string} keys A list of keys to delete.
   * @returns {undefined}
   */
  async delete(...keys) {
    debug('Deleting redis cache with key %O', keys);
    return await this.client.delAsync(...keys);
  }

  /**
   * A wrapper around redis.flushall
   * @returns {undefined}
   */
  async flushall() {
    debug('Flushing all redis cache');
    return this.client.flushallAsync();
  }
}

export default new RedisManager();
