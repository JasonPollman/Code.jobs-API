/**
 * Exports all routes.
 * @file
 */

import _ from 'lodash';
import modelBasedRoutes from '../database/model-routes';

import catchall from './catch';
import error from './error';
import ping from './ping';
import login from './login';
import unauthorized from './unauthorized';

const modelBasedRoutesMapped = _.mapKeys(modelBasedRoutes, (val, key) => `model:${key}`);

/**
 * All routes *must* be defined here, otherwise they won't get picked up!
 * Export ordering doesn't matter since the route all routes will be sorted by their
 * "specificity" property.
 * @type {object<object>}
 */
export default {
  ...modelBasedRoutesMapped,

  // Please keep these in alphabetical order!
  catchall,
  error,
  login,
  ping,
  unauthorized,
};
