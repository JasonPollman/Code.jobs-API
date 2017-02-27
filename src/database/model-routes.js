/**
 * Add model based routes here.
 * These will get merged in with /routes/index.js
 * @file
 */

import _ from 'lodash';
import createCRUDRoutes from '../lib/auto-route';
import models from './models';
import permissions from '../config/permissions';
import roles from '../config/roles';

const {
  User,
  Role,
  Permission,
  RolePermission,
  Request,
  Response,
} = models;

const {
  VIEW_SELF,
  VIEW_OTHERS,
  EDIT_SELF,
  EDIT_OTHERS,
  DELETE_SELF,
  DELETE_OTHERS,
  CREATE_ACCOUNT,
} = permissions;

const {
  ADMIN,
} = roles;

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
        permissions: [VIEW_SELF, VIEW_OTHERS],
        // Format the results of the values returned from the database
        formatResults: (request, result, type, bounce) => {
          const user = result;
          const role = user.role || { name: null, permissions: [] };

          user.role = role.name;
          user.permissions = role.permissions.map(permission => permission.name);

          const permitted = request.user.role === ADMIN.name
            || (request.user.id !== user.id && _.includes(request.user.permissions, VIEW_OTHERS))
            || (request.user.id === user.id && _.includes(request.user.permissions, VIEW_SELF));

          if (type === 'one') return permitted ? user : bounce();
          return permitted ? user : null;
        },
      },
      update: {
        permissions: [EDIT_SELF, EDIT_OTHERS],
      },
      delete: {
        permissions: [DELETE_SELF, DELETE_OTHERS],
      },
      create: {
        permissions: [CREATE_ACCOUNT],
      },
    },
  ),

  // General model routes
  ..._.mapValues({
    rolePermissions: RolePermission,
    role: Role,
    permission: Permission,
  }, Model => createCRUDRoutes(Model)),

  // Read only logging routes
  request: createCRUDRoutes(Request, {
    create: { exclude: true },
    update: { exclude: true },
    delete: { exclude: true },
  }),

  response: createCRUDRoutes(Response, {
    create: { exclude: true },
    update: { exclude: true },
    delete: { exclude: true },
  }),
};
