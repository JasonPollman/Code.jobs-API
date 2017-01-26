/**
 * Defines how each permission is determined.
 * @file
 */

import _ from 'lodash';

/**
 * This object stores key/value pairs between a permission and it's handler.
 * Return true to allow the user to continue, or false to send a 401 response.
 *
 * The handlers should be in the format (req) => { ... } where the req is the request.
 * @see https://www.npmjs.com/package/connect-roles
 * @type {object<function>}
 */
export default Object.freeze({

  // ----------------------------------- GENERIC PERMISSISONS ----------------------------------- //
  // No permission, everyone is allowed to access.
  NONE: () => true,
  // Everyone can login...
  LOGIN: () => true,

  // ------------------------------ PERMISSIONS DEALING WITH USERS ------------------------------ //
  // Only admins can view other user's information
  VIEW_OTHER_USERS_INFO: req => _.isObject(req.user) && req.user.group === 'admin',
  // Only admins can update other user's information
  UPDATE_OTHER_USERS_INFO: req => _.isObject(req.user) && req.user.group === 'admin',
  // Authenticated users can view their own info
  VIEW_OWN_INFO: req => req.isAuthenticated(),
  // Authenticated users can view their own info
  UPDATE_OWN_INFO: req => req.isAuthenticated(),

});
