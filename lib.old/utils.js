/**
 * Generic utility functions
 * @file
 */

import util from 'util';
import crypto from 'crypto';
import _ from 'lodash';

/**
 * Used to spread into Object.defineProperties.
 * @type {object<boolean>}
 */
export const IMMUTABLE_VISIBLE = {
  configurable: false,
  writable: false,
  enumerable: true,
};

/**
 * Convenience function for util.inspect
 * @param {any} item The item to inspect.
 * @returns {string} The formatted string.
 */
export function inspect(item) {
  return util.inspect(item, { colors: true, depth: 10 });
}

/**
 * Used to sort routes based on specificity.
 * @param a A route to sort.
 * @param b A route to compare to a.
 * @returns {number} -1, 1, or 0 based on the comparison of a and b.
 */
export function sortRoutes(a, b) {
  const specA = Number(a.specificity || 0);
  const specB = Number(b.specificity || 0);
  if (specA < specB) return -1;
  return specA > specB ? 1 : 0;
}

/**
 * Handles the hashing of user passwords.
 * @param {string} password
 * @param {string} salt
 * @returns {string} The hasher user password.
 */
export function hashUserPassword(password, salt) {
  return crypto.createHmac('sha256', Buffer.from(salt, 'utf8')).update(password).digest('hex');
}

/**
 * Recursively freezes the given object.
 * @param {object} o The object to "deep freeze".
 * @returns {object} The originally passed in object, now frozen.
 */
export function deepFreeze(o) {
  if (_.isObject(o)) _.each(o, deepFreeze);
  Object.freeze(o);
  return o;
}

/**
 * Returns an md5 hash for the given string.
 * @param {string} s The string to get the md5 hash for.
 * @returns {string} The md5 hash for the given string.
 */
export function md5(s) {
  if (!_.isString(s)) return s;
  return crypto.createHash('md5').update(s).digest('hex');
}

/**
 * Alias for Object.prototype.hasOwnProperty.call.
 * @param {object} object The object to inspect.
 * @param {string} property The property to assert own existence.
 * @returns {boolean} True if the object has the property, false otherwise.
 * @export
 */
export function has(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

/**
 * Walks an object recursively and invokes the "onValue" function for each nested child property.
 * @param {object} object The object to walk.
 * @param {function} fn A callback that will be invoked for each value in the object.
 * @param {boolean=} [assign=false] If truthy the return value from "onValue"
 * will overwrite the current value.
 * @param {number=} [maxDepth=null] The maximum depth to walk.
 * @param {Array<string>} [chain=Array] For recursion only. A list of the keys traversed
 * up to the current value in the object.
 * @returns {object} The original object passed in.
 * @export
 */
export function walkObject(object, fn, assign = false, maxDepth = null, chain = [], depth = 0) {
  // No reason to walk the object if the callback isn't a function, then
  // we'll be walking for nothing...
  if (!_.isFunction(fn) || !_.isObject(object)) return object;

  // Max depth reached, don't process any more child objects
  if (_.isNumber(maxDepth) && depth >= maxDepth) return object;

  _.each(object, (val, key) => {
    const results = fn(val, key, object, [...chain, key]);
    const o = object;

    if (assign) o[key] = results;
    walkObject(val, fn, assign, maxDepth, [...chain, key], depth + 1);
  });

  return object;
}

/**
 * Parses all JSON.strings within an object up to "depth".
 * @param {object} obj The object to resolve it's properties JSON strings.
 * @param {number} [depth=2] The maximum depth to walk.
 * @returns {object} The parsed object.
 * @export
 */
export function resolveJSONStrings(obj, depth = 2) {
  const onProperty = (val) => {
    try { return JSON.parse(val); } catch (e) { return val; }
  };

  return walkObject(obj, onProperty, true, depth);
}
