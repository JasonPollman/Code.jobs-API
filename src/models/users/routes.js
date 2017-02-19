/**
 * Defines the /users route.
 * @file
 */

import dataManager from '../../data';

/**
 * Returns a list of route objects used by the server to define the /users routes.
 * @export
 */
export default [
  {
    // Gets a user by the given field
    method: 'get',
    permission: 'get user',
    match: '/user/:field/:value',
    handler: async (req, res) => {
      const { field, value } = req.params;
      const payload = await dataManager.execute('users/get', { field, value, ...req.query });
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Gets all users
    method: 'get',
    permission: 'get user',
    match: '/users',
    handler: async (req, res) => {
      const payload = await dataManager.execute('users/get-paginated', req.query);
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Creates a user
    method: 'post',
    permission: 'create user',
    match: '/users/create',
    handler: async (req, res) => {
      const payload = await dataManager.execute('users/create', req.body);
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Deletes a user
    method: 'post',
    permission: 'delete user',
    match: '/users/delete',
    handler: async (req, res) => {
      const payload = await dataManager.execute('users/delete', req.body);
      return res.status(200).respond({ success: true, payload });
    },
  },
];
