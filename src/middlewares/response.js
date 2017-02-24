/**
 * Sets a .respond() method on the response object.
 * Which should be used by all routes to send a "common response interface".
 * @file
 */

import _ from 'lodash';
import JSONResponse from '../lib/response';

/**
 * Adds a .respond() method to the response object so all responses will be in the same format.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function compliantResponse(request, response, next) {
  const res = response;

  res.respond = (data) => {
    const responseData = _.isError(data) ? data : { status: res.statusCode, ...data };
    const body = new JSONResponse(responseData);

    // Emitted once the response is actually sent off and all headers have been added, etc.
    res.once('finish', () => res.emit('transmitted', body, request, response));

    // Emitted now, just prior to sending the response.
    res.emit('transmitting', body, request, response);
    res.json(body);
  };

  next();
}
