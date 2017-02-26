/**
 * Add model based routes here.
 * These will get merged in with /routes/index.js
 * @file
 */

import _ from 'lodash';
import createCRUDRoutes from '../lib/auto-route';
import models from './models';
import permissions from '../config/permissions';

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
        formatResults: (result) => {
          const user = result;
          const role = user.role || { name: null, permissions: [] };
          user.role = role.name;
          user.permissions = role.permissions.map(permission => permission.name);
          return user;
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
    RolePermission,
    Role,
    Permission,
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
