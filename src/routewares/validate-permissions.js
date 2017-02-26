/**
 * Checks that the user has the necessary permissions to access the route.
 * @file
 */

import _ from 'lodash';
import url from 'url';
import log from '../lib/logger';
import unauthorized from '../routes/unauthorized';
import config from '../config';

import PERMISSIONS from '../config/permissions';
import ROLES from '../config/roles';

const { DISABLE_ROUTE_PERMISSIONS } = config.SERVER;
const { NODE_ENV } = config;
const { NONE } = PERMISSIONS;
const { ADMIN } = ROLES;

/**
 * Checks that the user has the necessary permissions to access the route.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function validateUserPermissionsMiddleware(permissions) {
  return async function validateUserPermissions(request, response, next) {
    if (DISABLE_ROUTE_PERMISSIONS && NODE_ENV !== 'production') return next();

    // Route has no permissions
    if (!permissions.length || _.includes(permissions, NONE)) return next();
    const { user, method, ip } = request;

    // User has one of the necessary permissions to access this route
    if (_.isPlainObject(user)
      && (user.role === ADMIN.name || _.intersection(user.permissions, permissions).length > 0)) {
      return next();
    }

    // Unauthorized...
    const { pathname } = url.parse(request.url);
    log.warn(...(user
        ? ['Unauthorized %s to %s by user %s @%s', method, pathname, user.email, ip]
        : ['Unauthorized %s to %s by unknown user @%s', method, pathname, ip]));

    return unauthorized.handler.call(this, request, response);
  };
}
