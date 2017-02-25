/**
 * Checks for the "X-Application-Identifier"
 * @file
 */

import unauthorized from '../routes/unauthorized';
import config from '../config';
import { Application } from '../database/models';

const { APP_ID_VALIDATION_ENABLED } = config.SERVER;

/**
 * Checks that the "X-Application-Identifier" header is present and valid.
 * If not, the user is bounced to: '/unauthorized'.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function validateApplicationIdentifierMiddleware(enabled) {
  return async function validateApplicationIdentifier(request, response, next) {
    if (!enabled || !APP_ID_VALIDATION_ENABLED) return next();
    const bounce = () => unauthorized.handler.call(this, request, response);

    // Look for the X-Application-Identifier header
    const uuid = request.headers['x-application-identifier'];
    if (!uuid) return bounce();

    // Find the application in the database
    const app = await Application.findOne({ where: { uuid } });

    // If it exists and is enabled, continue, otherwise bounce to unauthorized.
    if (app && app.get('enabled')) {
      response.header('X-Application-Name', app.get('name'));
      return next();
    }

    return bounce();
  };
}
