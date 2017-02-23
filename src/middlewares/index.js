/**
 * Exports all middlewares.
 * @file
 */

import headers from './headers';
import response from './response';

/**
 * All middlewares *must* be defined here, otherwise they won't get picked up!
 * You can disable middlewares in config.json by setting setting the export name to true
 * in DISABLED_MIDDLEWARES for the desired environment, for example:
 * { "DISABLED_MIDDLEWARES": { "response": true } }
 * @type {object<object>}
 */
export default {
  headers,
  response,
};
