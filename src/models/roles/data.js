/**
 * Defines the data model with the associated roles table.
 * @file
 */

import constants from '../../lib/constants';
import dataManager from '../../data';

// The prefix for the roles table
const ROLES_PREFIX = constants.QUERY_CACHE_SETTINGS.ROLES_PREFIX;

/**
 * Returns a list of query objects that will be used by the database abstractor for the roles table.
 * @param {DBAbstractor} dataManager The database abstractor library.
 * @returns {Array<object>} A list of query definitions to be passed to dataManager.define().
 * @export
 */
export function generateQueryList() {
  return [
    // Create the "roles/get" and "roles/get-paginated" queries
    ...dataManager.createGetAndPaginatedQueries('roles', ROLES_PREFIX),
    // Create the "roles/create" query
    {
      script: 'roles/create',
      postfetch: async (results) => {
        // Error creating record, return the error
        if (!results || results.affectedRows !== 1) return results;

        // Prime the cache with the newly created record by fetching it and also
        // use this lookup to delete all other associated cache with any fields of this value.
        const role = await dataManager.execute('roles/get', {
          field: 'id',
          value: results.insertId,
        });

        // Delete all cache associated with the newly created item's fields.
        return dataManager.deleteAllCacheWithPrefixAndFields(ROLES_PREFIX)(role);
      },
      fields: {
        name: {
          required: true,
          type: 'string',
          coerce: value => value.toLowerCase(),
        },
        description: {
          required: true,
          type: 'string',
        },
      },
    },
  ];
}

export default () => dataManager.define(...generateQueryList());
