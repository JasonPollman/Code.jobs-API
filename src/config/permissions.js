/**
 * A set of permissions used by routes.
 * @file
 */

export default Object.freeze({
  // Users
  CREATE_ACCOUNT: 'create account',
  VIEW_SELF: 'view self',
  VIEW_OTHERS: 'view others',
  EDIT_SELF: 'edit self',
  EDIT_OTHERS: 'edit others',
  DELETE_SELF: 'delete self',
  DELETE_OTHERS: 'delete others',

  // Roles
  CREATE_ROLES: 'create roles',
  EDIT_ROLES: 'edit roles',
  UPDATE_ROLES: 'update roles',
  DELETE_ROLES: 'delete roles',

  // Permissions
  CREATE_PERMISSIONS: 'create permissions',
  EDIT_PERMISSIONS: 'edit permissions',
  UPDATE_PERMISSIONS: 'update permissions',
  DELETE_PERMISSIONS: 'delete permissions',
});

export const descriptions = Object.freeze({
  // Users
  CREATE_ACCOUNT: 'Permits a user to create an account',
  VIEW_SELF: 'Permist a user to view their own information',
  VIEW_OTHERS: 'Permits a user to view other user\'s information',
  EDIT_SELF: 'Permits a user to edit their own information',
  EDIT_OTHERS: 'Permits a user to edit other user\'s information',
  DELETE_SELF: 'Permits a user to delete their own account',
  DELETE_OTHERS: 'Permits a user to delete other user\'s accounts',

  // Roles
  CREATE_ROLES: 'Permits a user to create roles',
  EDIT_ROLES: 'Permits a user to edit roles',
  UPDATE_ROLES: 'Permits a user to update roles',
  DELETE_ROLES: 'Permits a user to delete roles',

  // Permissions
  CREATE_PERMISSIONS: 'Permits a user to create permissions',
  EDIT_PERMISSIONS: 'Permits a user to edit permissions',
  UPDATE_PERMISSIONS: 'Permits a user to update permissions',
  DELETE_PERMISSIONS: 'Permits a user to delete permissions',
});
