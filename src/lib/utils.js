/**
 * Generic utility functions
 * @file
 */

import util from 'util';
import crypto from 'crypto';
import _ from 'lodash';

export const NOOP_IDENT = x => x;

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
export function hashUserPassword(password, salt, algorithm = 'sha256') {
  return crypto.createHmac(algorithm, Buffer.from(salt, 'utf8')).update(password).digest('hex');
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
    const results = fn(val, key, object, [...chain]);
    const o = object;

    if (assign) o[key] = results;
    walkObject(val, fn, assign, maxDepth, [...chain, key], depth + 1);
  });

  return object;
}

/**
 * Clamps a number between 0 and Number.MAX_VALUE, inclusive.
 * @param {number} n The number to clamp.
 * @returns {number} The clamped value of n.
 * @export
 */
export function finiteGreaterThanZero(n) {
  return _.isNumber(n) ? _.clamp(n, 0, Number.MAX_VALUE) : n;
}

/**
 * Validates a route object.
 * @param {object} route The route object to validate.
 * @param {string} category The "category" (or export name) of the route object.
 * @returns {object} The passed in route object.
 * @export
 */
export function validateRoute(route, category) {
  const { handler, match } = route;

  if (!_.isFunction(handler)) {
    throw new TypeError(
      `Route listed in "${category}" must have a callback function as the value for property "handler".`);
  }

  if (!Array.isArray(match) && !_.isRegExp(match) && !_.isString(match)) {
    throw new TypeError(
      `Route listed in "${category}" must have a string, Array, or RegExp value for property "match".`);
  }

  return route;
}

/**
 * Converts an hrtime tuple to milliseconds
 * @param {Array<number>} hrtime An hrtime tuple.
 * @returns {number} The number of milliseconds representing the hrtime tuple.
 * @export
 */
export function hrtimeToMilliseconds(hrtime) {
  return (((hrtime[0] * 1e+9) + hrtime[1]) / 1e6);
}

/**
 * Returns the boolean equivalent or the original value.
 * @param {any} value The value to inspect.
 * @returns {boolean} True, false or the original value.
 * @export
 */
export function getBoolOrOriginalValue(value) {
  const bools = ['true', true, 'false', false];
  return _.includes(bools, value) ? value === 'true' || value === true : value;
}

/**
 * Strips the "s" off the end of a string.
 * @param {string} string The string to "singularize".
 * @returns The modified string.
 * @export
 */
export function singular(string) {
  return string.replace(/s$/, '');
}

/**
 * Adds an "s" to the end of a string, if it doesn't already exist.
 * @param {string} string The string to "singularize".
 * @returns The modified string.
 * @export
 */
export function plural(string) {
  return string.replace(/s?$/, 's');
}

/**
 * A helper to combine 2 or more sequelize hooks.
 * @param {...function} fns The functions to execute serially.
 * @returns {undefined}
 * @export
 */
export function combineHooks(...fns) {
  return (...args) => fns.forEach(fn => fn(...args));
}

/**
 * Returns an error with a .status property. This is used when an error is thrown
 * and returned to the user (it also sets the response status code).
 * @param {number} [status=500]
 * @param {string} [message='An unknown error has occurred']
 * @param {string} [name='Error']
 * @returns {Error} The new error
 * @export
 */
export function eStatus(
  status = 500, message = 'An unknown error has occurred', name = 'Error', code) {
  const error = _.isError(message) ? message : new Error(message);
  return Object.assign(error, { status, name, code });
}
