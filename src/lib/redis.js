import _ from 'lodash';
import redis from 'redis';
import config from '../config';
import log from './logger';
import { has } from './utils';

const { ENABLED, HOST, PORT } = config.REDIS;

// Add async promisified methods to the redis library
const methods = Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

/**
 * Stores a reference to the redis clients.
 * Each of these will be null until init([type]) is called.
 */
const clients = { default: null, pub: null, sub: null };

/**
 * Creates the redis client, if enabled, or a bunch of _.noop functions if disabled.
 * @param {string} type The type of redis client ('default', 'pub', or 'sub').
 * @returns {RedisClient} The redis client connection for the given type.
 */
function setupClientType(type) {
  if (clients[type]) return clients[type];
  if (!has(clients, type)) throw new TypeError(`Invalid redis client type ${type}`);

  log.debug('Creating redis client "%s"', type);

  clients[type] = ENABLED
    ? redis.createClient(PORT, HOST)
    : _.mapValues(methods, () => () => Promise.resolve('null'));

  return clients[type];
}

export default {
  // Default client for set/get/del
  get client() {
    return setupClientType('default');
  },
  // Publish client for redis.publish
  get pub() {
    return setupClientType('pub');
  },
  // Subscribe client for redis.subscribe
  get sub() {
    return setupClientType('sub');
  },
  // Initializes all redis connections
  init() {
    _.map(clients, (value, type) => setupClientType(type));
    return exports.default;
  },
  // Used to get a cache key with the provided arguments
  key(...args) {
    return args.join('::');
  },
  // Set an object and return a promise
  async setAsync(key, value) {
    log.trace('Redis SET "%s"', key);
    return exports.default.client.setAsync(key, JSON.stringify(value));
  },
  // Get an object and return a promise
  async getAsync(key) {
    const result = await JSON.parse(await exports.default.client.getAsync(key));
    log.trace('Redis GET "%s" => %s', key, result ? `\n${JSON.stringify(result, null, 2)}` : '(cache miss)');
    return result;
  },
  // Get an object and return a promise
  async getAllAsync(...keys) {
    return await Promise.map(keys, exports.default.getAsync);
  },
  // Delete the list of keys provided
  async delAsync(...keys) {
    log.trace('Redis DEL "%s"', keys.join(', '));
    return exports.default.client.delAsync(keys);
  },
  // Convenience method for publishing
  publish(channel, message) {
    log.trace('Redis PUB "%s"', channel);
    return exports.default.pub.publish(channel, JSON.stringify(message));
  },
  // Convenience method for subscribing
  subscribe(channel) {
    log.trace('Redis SUB "%s"', channel);
    return exports.default.sub.subscribe(channel);
  },
  // Convenience method for redis.sub.on('message')
  onMessage(callback) {
    exports.default.sub.on('message', (channel, message) => callback(channel, JSON.parse(message)));
  },
};
