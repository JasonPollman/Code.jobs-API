/**
 * Sets basic headers for all routes.
 * @file
 */

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
  response.header('X-Powered-By', 'Code Jobs API');
  next();
}
