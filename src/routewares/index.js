/**
 * Exports all route specific middlewares.
 * @file
 */

import validateAppIdentifier from './validate-app-id';

/**
 * All route based middlewares *must* be defined here, otherwise they won't get picked up!
 *
 * Note, the order in which you list the middlewares here, will affect the order in which
 * they're applied!
 * @type {object<object>}
 */
export default {
  // Please keep these in alphabetical order!
  validateAppIdentifier,
};
