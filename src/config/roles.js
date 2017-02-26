/**
 * A set of roles used by user accounts.
 * This is used by the setup script to create the necessary roles for
 * the backend.
 * @file
 */

import permissions from './permissions';

export default Object.freeze({
  ADMIN: {
    name: 'admin',
    description: 'A super user that has all permissions',
    permissions: [],
  },
  DISABLED_USER: {
    name: 'disabled',
    description: 'A user account that has been disabled',
    permissions: [],
  },
  ANONYMOUS_USER: {
    name: 'anonymous',
    description: 'An un-authenticated user',
    permissions: [
      permissions.CREATE_ACCOUNT,
    ],
  },
  MODERATOR: {
    name: 'moderator',
    description: 'A user with some elevated privledges, but not as powerful as an admin',
    permissions: [
      permissions.CREATE_ACCOUNT,
      permissions.VIEW_SELF,
      permissions.VIEW_OTHERS,
      permissions.EDIT_SELF,
      permissions.EDIT_OTHERS,
      permissions.DELETE_SELF,
      permissions.VIEW_REQUESTS,
      permissions.VIEW_RESPONSES,
    ],
  },
  STANDARD_USER: {
    name: 'user',
    description: 'An standard user',
    permissions: [
      permissions.VIEW_SELF,
      permissions.VIEW_OTHERS,
      permissions.EDIT_SELF,
      permissions.DELETE_SELF,
    ],
  },
});
