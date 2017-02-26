/**
 * Exports all middlewares.
 * @file
 */

import compression from 'compression';
import parser from 'body-parser';

import cors from './cors';
import headers from './headers';
import response from './response';
import limiter from './request-limit';
import requestStats from './request-stats';
import requestLogger from './request-logger';

/**
 * Options used by each body-parser type.
 * @type {object}
 */
const options = {
  extended: true,
};

/**
 * The body parsers we'll be using
 * @type {object<function>}
 */
const parsers = {
  urlencodedBodyParser: parser.urlencoded(options),
  jsonBodyParser: parser.json(options),
};

/**
 * All middlewares *must* be defined here, otherwise they won't get picked up!
 * You can disable middlewares in config.json by setting setting the export name to true
 * in DISABLED_MIDDLEWARES for the desired environment, for example:
 * { "DISABLED_MIDDLEWARES": { "response": true } }
 *
 * Note, the order in which you list the middlewares here, will affect the order in which
 * they're applied!
 * @type {object<object>}
 */
export default {
  response,
  requestLogger,
  requestStats,
  limiter,
  cors,
  compression: compression(),
  headers,
  ...parsers,
};
