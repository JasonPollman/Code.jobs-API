/**
 * Add model based routes here.
 * These will get merged in with /routes/index.js
 * @file
 */

import autogenerateCRUDRoutes from '../lib/auto-route';
import models from './models';

const {
  User,
  Role,
  Permission,
} = models;

export default {
  // Model related routes
  user: autogenerateCRUDRoutes(User,
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
      create: {
        permissions: ['create user'],
      },
      retrieve: {
        permissions: ['view self', 'view others'],
        // Format the results of the values returned from the database
        formatResults: (result) => {
          const user = result;
          const role = user.role;
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
    },
  ),
};
