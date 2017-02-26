/**
 * Exports the statistics middleware.
 * This middleware keeps track of the number of requests and responses handled.
 * @file
 */

import url from 'url';

/**
 * Stores request statistics
 * @type {object<object>}
 */
export const requestStatistics = {
  processed: {
    requests: 0,
    responses: 0,
  },
  urls: {},
};

const incrementResponses = () => { requestStatistics.processed.responses++; };

/**
 * Keeps stats about the various requests/responses handled by the worker.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function statistics(request, response, next) {
  const { processed, urls } = requestStatistics;

  processed.requests++;
  const href = url.parse(request.url);

  urls[href.pathname] = (urls[href.pathname] || 0) + 1;
  response.on('transmitting', incrementResponses);
  next();
}
