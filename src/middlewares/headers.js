/**
 * Sets basic headers for all routes.
 * @file
 */

import _ from 'lodash';
import config from '../config';
import { hrtimeToMilliseconds } from '../lib/utils';

const { EXTRA_HEADERS, DISABLE_HEADERS } = config.SERVER;
const { APPLICATION_NAME } = config;

/**
 * A callback for response.once('transmitting') that adds the "X-Response-Time" header.
 * @param {object} body The JSON response body.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @returns {undefined}
 */
function XResponseTimeListener(body, request, response) {
  const elapsed = hrtimeToMilliseconds(process.hrtime(request.requestedAt)).toFixed(2);
  response.header('X-Response-Time', `${elapsed}ms`);
}

/**
 * Strips ignored headers just before sending the response.
 * @returns {undefined}
 */
function stripIgnoredHeaders(body, request, response) {
  _.each(DISABLE_HEADERS, (ignoring, name) => {
    if (ignoring) response.removeHeader(name);
  });
}

/**
 * Sets basic headers for all routes.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function headers(request, response, next) {
  // All responses will be in JSON, so set the content type header for every request.
  response.header('Content-Type', 'application/json');

  // Add X-Response-Time header
  if (!DISABLE_HEADERS['X-Response-Time']) {
    const req = request;
    req.requestedAt = process.hrtime();
    response.once('transmitting', XResponseTimeListener);
  }

  // Add X-Powered-By header
  if (!DISABLE_HEADERS['X-Powered-By']) {
    response.header('X-Powered-By', APPLICATION_NAME);
  }

  // Set headers on per-environment basis
  _.each(EXTRA_HEADERS, (value, name) => response.header(name, value));

  // Strip ignored headers, if they were set somewhere else
  response.once('transmitting', stripIgnoredHeaders);
  next();
}
