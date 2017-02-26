/**
 * Exports all the various data models
 * @file
 */

import User from './User';
import Application from './Application';
import Permission from './Permission';
import Role from './Role';
import RolePermission from './RolePermission';
import Request from './Request';
import Response from './Response';

export default {
  // Please keep these in alphabetical order!
  Application,
  Permission,
  Response,
  Request,
  Role,
  RolePermission,
  User,
};

// So we can use the import { User } syntax...
Object.assign(exports, { ...exports.default });
