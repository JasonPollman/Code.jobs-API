/**
 * Defines the data model with the associated responses table.
 * @file
 */

import constants from '../../lib/constants';
import dataManager from '../../data';

// The prefix for the responses table
const RESPONSES_PREFIX = constants.QUERY_CACHE_SETTINGS.RESPONSES_PREFIX;

/**
 * Returns a list of query objects that will be used by the database
 * abstractor for the responses table.
 * @param {DBAbstractor} dataManager The database abstractor library.
 * @returns {Array<object>} A list of query definitions to be passed to dataManager.define().
 * @export
 */
export default function generateQueryList() {
  return [
    // Create the "responses/get" and "responses/get-paginated" queries
    ...dataManager.createGetAndPaginatedQueries('responses', RESPONSES_PREFIX, true),
    // Create the "responses/create" query
    {
      script: 'responses/create',
      fields: {
        body: {
          required: true,
          coerce: JSON.stringify,
          type: 'string',
        },
        headers: {
          required: true,
          coerce: JSON.stringify,
          type: 'string',
        },
        time: {
          required: true,
          coerce: Number,
          type: 'number',
        },
        request: {
          required: true,
          coerce: Number,
          type: 'number',
        },
      },
    },
  ];
}

dataManager.define(...generateQueryList());
