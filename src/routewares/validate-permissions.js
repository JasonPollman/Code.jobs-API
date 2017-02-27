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

    const conditions = [
      // Admin user, allowed for all routes
      () => user.role === ADMIN.name,
      // An array of permissions, check user and permissions intersection for at least on match
      () => _.isArray(permissions) && _.intersection(user.permissions, permissions).length > 0,
      // Permissions is a function, if the result is true permit the user
      () => _.isFunction(permissions) && permissions(request, user, this.route) === true,
    ];

    if (_.isPlainObject(user) && conditions.some(fn => fn())) return next();

    // Unauthorized...
    const { pathname } = url.parse(request.url);
    log.warn(...(user
        ? [{ ip }, 'Unauthorized %s to %s by user %s', method, pathname, user.id]
        : [{ ip }, 'Unauthorized %s to %s by unknown user', method, pathname]));

    return unauthorized.handler.call(this, request, response);
  };
}
