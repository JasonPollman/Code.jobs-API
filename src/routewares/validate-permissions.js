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

const { DISABLE_ROUTE_PERMISSIONS } = config.SERVER;
const { NODE_ENV } = config;
const { NONE } = PERMISSIONS;

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
    const { user, method } = request;

    // User has one of the necessary permission to access this route
    if (_.isObject(user) && _.intersection(user.permissions, permissions).length > 0) return next();
    const href = url.parse(request.url);

    // Unauthorized...
    log.warn(...(user
        ? ['Unauthorized %s to %s by user %s @%s', method, href.pathname, user.email, request.ip]
        : ['Unauthorized %s to %s by unknown user @%s', method, href.pathname, request.ip]));

    return unauthorized.handler.call(this, request, response);
  };
}
