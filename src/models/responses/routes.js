/**
 * Defines the /responses route.
 * @file
 */

import dataManager from '../../data';
import { resolveJSONStrings } from '../../lib/utils';

/**
 * Returns a list of route objects used by the server to define the /responses routes.
 * @export
 */
export default [
  {
    // Gets a response by the given field
    method: 'get',
    permission: 'get logs',
    match: '/responses/:field/:value',
    handler: async (req, res) => {
      const { field, value } = req.params;
      const payload = resolveJSONStrings(await dataManager.execute('responses/get', { field, value, ...req.query }));
      return res.status(200).respond({ success: true, payload });
    },
  },
  {
    // Gets all responses
    method: 'get',
    permission: 'get logs',
    match: '/responses',
    handler: async (req, res) => {
      const payload = resolveJSONStrings(await dataManager.execute('responses/get-paginated', req.query));
      return res.status(200).respond({ success: true, payload });
    },
  },
];
