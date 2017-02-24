/**
 * Sets up database associations and relationships.
 * @file
 */

import models from './models';

const {
  User,
  Role,
  Permission,
  RolePermission,
} = models;

// Add roleId foreign key to the users table
User.belongsTo(Role);
Role.hasMany(User);

// Add roleId and permissionId to the rolePermissions table
Role.belongsToMany(Permission, { through: RolePermission });
Permission.belongsToMany(Role, { through: RolePermission });
