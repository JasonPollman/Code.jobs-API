/**
 * Exports all routes.
 * @file
 */

import catchall from './catch';
import error from './error';
import ping from './ping';
import unauthorized from './unauthorized';

/**
 * All routes *must* be defined here, otherwise they won't get picked up!
 * @type {object<object>}
 */
export default {
  catchall,
  error,
  ping,
  unauthorized,
};
