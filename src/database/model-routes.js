/**
 * Add model based routes here.
 * These will get merged in with /routes/index.js
 * @file
 */

import _ from 'lodash';
import createCRUDRoutes from '../lib/auto-route';
import models from './models';

const {
  User,
  Role,
  Permission,
  RolePermission,
} = models;

export default {
  // User routes
  user: createCRUDRoutes(User,
    {
      include: [
        {
          model: Role,
          attributes: ['name'],
          include: {
            model: Permission,
            attributes: ['name'],
          },
        },
      ],
    },
    {
      retrieve: {
        permissions: ['view self', 'view others'],
        // Format the results of the values returned from the database
        formatResults: (result) => {
          const user = result;
          const role = user.role || { name: null, permissions: [] };
          user.role = role.name;
          user.permissions = role.permissions.map(permission => permission.name);
          return user;
        },
      },
      update: {
        permissions: ['update self', 'update others'],
      },
      delete: {
        permissions: ['delete self', 'delete others'],
      },
      create: {
        permissions: ['create users'],
      },
    },
  ),

  // General model routes
  ..._.mapValues({
    RolePermission,
    Role,
    Permission,
  }, Model => createCRUDRoutes(Model)),
};
