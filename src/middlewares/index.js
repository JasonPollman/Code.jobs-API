/**
 * Exports all middlewares.
 * @file
 */

import debug from './debug';
import headers from './headers';
import logging from './logging';
import response from './response';

/**
 * All middlewares *must* be defined here, otherwise they won't get picked up!
 * @type {object<object>}
 */
export default {
  debug,
  headers,
  logging,
  response,
};
