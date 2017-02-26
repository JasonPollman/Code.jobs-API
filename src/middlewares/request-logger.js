/**
 * Logs requests/responses to the database.
 * @file
 */

import uuid from 'uuid/v4';
import url from 'url';
import { Request, Response } from '../database/models';

/**
 * Logs requests/responses to the database.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function requestLogger(request, response, next) {
  const { method, originalUrl, ip, user } = request;
  const headers = request.headers;
  const href = url.parse(originalUrl);
  const identifier = uuid();
  const requested = Date.now();

  // Log the request
  // Don't wait for this to complete.
  Request.create({
    ip,
    uuid: identifier,
    requested,
    method,
    user: user ? user.id : null,
    path: href.pathname,
    url: originalUrl,
    referer: headers.referer,
    userAgent: headers['user-agent'],
    headers: JSON.stringify(headers),
  });

  // Log the response
  // Also, don't wait for this to complete.
  response.once('transmitted', () => {
    const sent = Date.now();
    Response.create({
      sent,
      uuid: identifier,
      responseTime: sent - requested,
      status: response.statusCode,
      headers: JSON.stringify(response._headers), // eslint-disable-line no-underscore-dangle
    });
  });

  next();
}
