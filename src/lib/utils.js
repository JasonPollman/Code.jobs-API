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
 * @param {object} obj The object to walk.
 * @param {function} onValue A callback that will be invoked for each value in the object.
 * @param {boolean=} [assign=false] If truthy the return value from "onValue" will overwrite
 * the current value.
 * @param {Array<string>} [chain=[]] For recursion only. A list of the keys traversed up to the
 * current value in the object.
 * @returns {object} The original object passed in.
 * @export
 */
export function walkObject(obj, onValue, assign = false, chain = []) {
  // No reason to walk the object if the callback isn't a function, then
  // we'll be walking for nothing...
  if (!_.isFunction(onValue) || !_.isObject(obj)) return obj;

  _.each(obj, (val, key) => {
    const results = onValue(val, key, obj, [...chain, key]);
    const object = obj;

    if (assign) object[key] = results;
    walkObject(val, onValue, assign, [...chain, key]);
  });

  return obj;
}

export function resolveJSONStrings(obj) {
  return walkObject(obj, (val) => {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }, true);
}
