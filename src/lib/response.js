/**
 * Defined a Response class that will be merged with all response objects
 * to ensure a common interface for API responses.
 * @file
 */

import _ from 'lodash';
import http from 'http';
import config from '../config';
import { walkObject, IMMUTABLE_VISIBLE } from './utils';

/**
 * Used to split by newlines.
 * @type {RegExp}
 */
const NEWLINES_G = /\r?\n/g;

/**
 * Default fields to be merged with every response.
 * @type {object<any>}
 */
const DEFAULT_RESPONSE = {
  status: 500,
  success: false,
  message: '',
  payload: null,
};

/**
 * The response interface for errors.
 * @param {any} e The error to generate a response from.
 * @returns {object} A response object.
 */
function errorResponse(error) {
  const { status, code, message } = error;
  const stack = config.NODE_ENV !== 'production' ? error.stack.split(NEWLINES_G) : undefined;
  return { success: false, status, code, message, stack };
}

/**
 * Strips passwords from response objects.
 * A fail safe to ensure these don't make it out.
 * @param {object} value The value from "walkObject".
 * @param {string} key The current key from "walkObject".
 * @param {object} parent The parent of value[key].
 * @returns {undefined}
 */
function stripPassword(value, key, parent) {
  if (key !== 'password') return;
  Object.assign(parent, { password: undefined });
}

/**
 * Defines a common interface for all responses.
 * @class Response
 * @export
 */
export default class JSONResponse {
  /**
   * Creates an instance of Response.
   * @param {object} body The response body.
   * @memberof Response
   */
  constructor(body = {}) {
    let response;

    switch (true) {
      case _.isError(body):
        response = errorResponse(body);
        break;

      case !_.isPlainObject(body):
        response = { message: body ? body.toString() : '' };
        break;

      default:
        response = body;
    }

    // Strip any passwords that *might* have made their way into a response
    walkObject(response, stripPassword);

    // Add default response values
    const properties = Object.assign({ time: Date.now() }, DEFAULT_RESPONSE, response);
    const { message, payload, status } = properties;

    // Use default HTTP status code, if no message
    if (!payload) properties.payload = null;
    if (!message) properties.message = http.STATUS_CODES[status];

    // Apply all properties to this response object and immute them.
    _.each(properties, (value, key) =>
      Object.defineProperty(this, key, { ...IMMUTABLE_VISIBLE, value }));
  }
}
