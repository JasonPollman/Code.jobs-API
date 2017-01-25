/**
 * Defined a Response class that will be merged with all response objects
 * to ensure a common interface for API responses.
 * @file
 */

import _ from 'lodash';

/**
 * Default fields to be merged with every response.
 * @type {object<any>}
 */
const DEFAULT_RESPONSE = {
  success: false,
  message: '',
};

/**
 * Defines a common interface for all responses.
 * @class Response
 * @export
 */
export default class Response {
  /**
   * Creates an instance of Response.
   * @param {object} response
   * @memberof Response
   */
  constructor(response = {}) {
    const resp = _.isPlainObject(response) ? response : { message: response ? response.toString() : '' };

    // All responses *must* have the time, message, and success fields.
    const properties = _.merge({ time: Date.now() }, DEFAULT_RESPONSE, resp);

    // Define immutable properties for the response object
    _.each(properties, (value, key) => {
      Object.defineProperty(this, key, {
        configurable: false,
        writable: false,
        enumerable: true,
        value,
      });
    });
  }
}
