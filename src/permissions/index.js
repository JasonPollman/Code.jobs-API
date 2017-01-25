/**
 * Defines how each permission is determined.
 * @file
 */

/**
 * This object stores key/value pairs between a permission and it's handler.
 * Return true to allow the user to continue, or false to send a 401 response.
 *
 * The handlers should be in the format (req) => { ... } where the req is the request.
 * @see https://www.npmjs.com/package/connect-roles
 * @type {object<function>}
 */
export default {
  // No permission, everyone is allowed to access.
  none: () => true,
  // Everyone can login
  // Might extend this in the future to only allow non-blocked ip addresses, etc.
  login: () => true,
};
