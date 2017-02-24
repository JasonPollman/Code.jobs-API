/**
 * Sets CORS settings
 * @file
 */

import _ from 'lodash';
import config from '../config';

const { CORS } = config.SERVER;

/**
 * A list of CORS Headers to lookup on the config.SEVER.CORS object.
 * @type {Array<string>}
 */
const CORS_HEADER_LIST = [
  'Access-Control-Allow-Origin',
  'Access-Control-Max-Age',
  'Access-Control-Allow-Credentials',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Methods',
];

function parseHeader(value) {
  if (_.isString(value)) return value;
  return _.isObject(value) ? _.toArray(value).join(', ') : null;
}

/**
 * The formatted, mapped set of CORS headers so each request can call:
 * _.each(CORS_HEADERS, response.header);
 * @type {Array<Array>}
 */
const CORS_HEADERS = Object.freeze(CORS_HEADER_LIST
  .map(name => ({ name, value: parseHeader(CORS[name]) }))
  .filter(({ value }) => value));

/**
 * Sets CORS headers for all routes.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function cors(request, response, next) {
  CORS_HEADERS.forEach(({ name, value }) => response.header(name, value));
  next();
}
