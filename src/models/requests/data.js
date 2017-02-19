/**
 * Defines the data model with the associated requests table.
 * @file
 */

import constants from '../../lib/constants';
import dataManager from '../../data';

// The prefix for the requests table
const REQUESTS_PREFIX = constants.QUERY_CACHE_SETTINGS.REQUESTS_PREFIX;

/**
 * Returns a list of query objects that will be used by the database
 * abstractor for the requests table.
 * @param {DBAbstractor} dataManager The database abstractor library.
 * @returns {Array<object>} A list of query definitions to be passed to dataManager.define().
 * @export
 */
export default function generateQueryList() {
  return [
    // Create the "requests/get" and "requests/get-paginated" queries
    ...dataManager.createGetAndPaginatedQueries('requests', REQUESTS_PREFIX, true),
    // Create the "requests/create" query
    {
      script: 'requests/create',
      postfetch: dataManager.lookupOnResultSetForTable('requests'),
      fields: {
        time: {
          required: true,
          type: 'number',
          default: Date.now(),
        },
        user: {
          required: false,
          type: 'number',
        },
        host: dataManager.STRING_REQUIRED,
        method: dataManager.STRING_REQUIRED,
        address: dataManager.STRING_REQUIRED,
        url: dataManager.STRING_REQUIRED,
        headers: {
          ...dataManager.STRING_REQUIRED,
          coerce: JSON.stringify,
        },
        params: {
          ...dataManager.STRING_REQUIRED,
          coerce: JSON.stringify,
        },
        query: {
          ...dataManager.STRING_REQUIRED,
          coerce: JSON.stringify,
        },
      },
    },
  ];
}

dataManager.define(...generateQueryList());
