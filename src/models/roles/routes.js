/**
 * Defines the /roles route.
 * @file
 */

import dataManager from '../../data';

/**
 * Returns a list of route objects used by the server to define the /roles routes.
 * @export
 */
export default [
  {
    // Gets a role by the given field
    method: 'get',
    permission: 'get role',
    match: '/roles/:field/:value',
    handler: async (req, res) => {
      const { field, value } = req.params;
      const payload = await dataManager.execute('roles/get', { field, value, ...req.query });
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Gets all roles
    method: 'get',
    permission: 'get role',
    match: '/roles',
    handler: async (req, res) => {
      const payload = await dataManager.execute('roles/get-paginated', req.query);
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Creates a role
    method: 'post',
    permission: 'create role',
    match: '/roles/create',
    handler: async (req, res) => {
      const payload = await dataManager.execute('roles/create', req.body);
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Deletes a role
    method: 'post',
    permission: 'delete role',
    match: '/roles/delete',
    handler: async (req, res) => {
      const payload = await dataManager.execute('roles/delete', req.body);
      return res.status(200).respond({ success: true, payload });
    },
  },
];
