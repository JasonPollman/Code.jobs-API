/**
 * Generic utility functions
 * @file
 */

import util from 'util';
import crypto from 'crypto';
import _ from 'lodash';

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
export function sortRoute(a, b) {
  if (a.specificity < b.specificity) return -1;
  return a.specificity > b.specificity ? 1 : 0;
}

/**
 * Handles the hashing of user passwords.
 * @param {object} user The user object to retrieve a hashed password for.
 * @returns {string} The hasher user password.
 */
export function hashUserPassword(user) {
  const { username, password } = user;
  return crypto.createHmac('sha256', Buffer.from(username, 'utf8')).update(password).digest('hex');
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
