/**
 * Debugs routing information
 * @file
 */

import debuggr from 'debug';
import cluster from 'cluster';
import constants from '../lib/constants';

const debug = debuggr(`api:routing:${cluster.isMaster ? 'master' : 'worker'}:${process.pid}`);

/**
 * Debugs information about routes.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function debugRoute(request, response, next) {
  if (constants.NODE_ENV === 'production') return next();

  const { method, originalUrl } = request;
  const { statusCode } = response;

  debug('REQUEST <= %O %O', method, originalUrl);
  response.once('transmitting', () => debug('RESPONSE => %O, %O', statusCode, originalUrl));
  return next();
}
