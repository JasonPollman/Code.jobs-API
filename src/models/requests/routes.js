/**
 * Defines the /requests route.
 * @file
 */

import dataManager from '../../data';
import { resolveJSONStrings } from '../../lib/utils';

/**
 * Returns a list of route objects used by the server to define the /requests routes.
 * @export
 */
export default [
  {
    // Gets a request by the given field
    method: 'get',
    permission: 'get logs',
    match: '/requests/:field/:value',
    handler: async (req, res) => {
      const { field, value } = req.params;
      const payload = resolveJSONStrings(await dataManager.execute('requests/get', { field, value, ...req.query }));
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Gets all requests
    method: 'get',
    permission: 'get logs',
    match: '/requests',
    handler: async (req, res) => {
      const payload = resolveJSONStrings(await dataManager.execute('requests/get-paginated', req.query));
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Creates a request
    method: 'post',
    permission: 'create logs',
    match: '/requests/create',
    handler: async (req, res) => {
      const payload = await dataManager.execute('requests/create', req.body);
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Deletes a request
    method: 'post',
    permission: 'delete logs',
    match: '/requests/delete',
    handler: async (req, res) => {
      const payload = await dataManager.execute('requests/delete', req.body);
      return res.status(200).respond({ success: true, payload });
    },
  },
];
