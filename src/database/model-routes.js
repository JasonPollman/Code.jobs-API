/**
 * Add model based routes here.
 * These will get merged in with /routes/index.js
 * @file
 */

import creatCRUDRoutes from '../lib/auto-route';
import models from './models';

const {
  User,
  Role,
  Permission,
} = models;

export default {
  // User routes
  user: creatCRUDRoutes(User,
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

  // Permission routes
  permission: creatCRUDRoutes(Permission,
    {
      retrieve: {
        permissions: ['view permissions'],
      },
      create: {
        permissions: ['create permissions'],
      },
      update: {
        permissions: ['update permissions'],
      },
      delete: {
        permissions: ['delete permissions'],
      },
    },
  ),
};
