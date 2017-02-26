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
    description: 'Super User Account',
    permissions: [],
  },
  DISABLED_USER: {
    name: 'disabled',
    description: 'An user that has been disabled',
    permissions: [],
  },
  ANONYMOUS_USER: {
    name: 'anonymous',
    description: 'An unauthenticated user',
    permissions: [
      permissions.CREATE_ACCOUNT,
    ],
  },
  MODERATOR: {
    name: 'moderator',
    description: 'Moderator Account',
    permissions: [
      permissions.CREATE_ACCOUNT,
      permissions.VIEW_SELF,
      permissions.VIEW_OTHERS,
      permissions.EDIT_SELF,
      permissions.EDIT_OTHERS,
      permissions.DELETE_SELF,
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
