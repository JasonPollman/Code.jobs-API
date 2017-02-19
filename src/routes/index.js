/**
 * Exports all routes.
 * @file
 */

import catchall from './catch';
import login from './login';
import ping from './ping';
import unauthorized from './unauthorized';

/**
 * All routes *must* be defined here, otherwise they won't get picked up!
 * @type {object<object>}
 */
export default {
  catchall,
  login,
  ping,
  unauthorized,
};
