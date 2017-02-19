/**
 * Defines a request/response database logging middleware.
 * @file
 */

import _ from 'lodash';
import dataManager from '../data';
import constants from '../lib/constants';
import JSONResponse from '../lib/json-response';

const isloggingEnabled = constants.DATA_LOGGING.ENABLED;
const isLoggingEnvironment = !_.includes(constants.DATA_LOGGING.ENVIRONMENTS, constants.NODE_ENV);
const isRequestResponseRoute = /^\/(requests|responses)/;

/**
 * Logs HTTPS responses once the response has been sent.
 * @param {Promise} logPromise The request logging promise, which returns
 * the newly created request log.
 * @returns {function} Consumed by response.once('transmitted');
 */
function logOnTransmission(logPromise) {
  return (body, request, response) => logPromise
    .then(requestLog => dataManager.execute('responses/create', {
      request: requestLog.id,
      time: Date.now(),
      body,
      headers: response._headers, // eslint-disable-line no-underscore-dangle
    }));
}

/**
 * Creates a log for every request/response
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default async function logRequest(request, response, next) {
  const { url, method, headers, params, query, user = { id: 0 }, ip } = request;
  // Don't log if logging is disabled, the route is /requests or /responses, or if
  // the environment isn't a logging environment.
  if (!isloggingEnabled || !isLoggingEnvironment || isRequestResponseRoute.test(url)) return next();

  try {
    // Don't wait to finish the request!
    const promise = dataManager.execute('requests/create', {
      time: Date.now(),
      host: constants.SERVER_HOSTNAME,
      user: user.id,
      url,
      address: ip,
      method,
      headers,
      params,
      query,
    });

    response.once('transmitted', logOnTransmission(promise));
    return next();
  } catch (e) {
    return response.json(new JSONResponse(e));
  }
}
