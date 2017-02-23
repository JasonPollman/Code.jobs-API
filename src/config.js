/**
 * Sets up configuration settings used throughout the application.
 * This merges the values in config.json
 * @file
 */

import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import JSON5 from 'json5';
import assert from 'assert';
import { cpus } from 'os';
import cluster from 'cluster';
import { deepFreeze, walkObject, finiteGreaterThanZero } from './lib/utils';

const {
  CONFIG_PATH = path.join(__dirname, '..', 'config.json'),
  NODE_ENV = 'production',
} = process.env;

/**
 * A set of options that cannot be overridden.
 * These are merged with the configuration below.
 * @type {object}
 */
const constants = {
  NODE_ENV,
  IS_WORKER: cluster.isWorker,
  PROCESS_TITLES: {
    MASTER: 'Code Jobs API Master',
    WORKER: 'Code Jobs API Worker',
  },
};

// Read in the config.json file and extend the default (*) env settings
// with the current env settings
const baseConfig = JSON5.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const config = _.merge({}, baseConfig['*'], baseConfig[NODE_ENV]);

/**
 * A set of validations to pass to assert.equal().
 * This is to validate the configuration post merging with environment variables
 * @type {Array<Array>}
 */
const validations = conf => [
  [
    'number',
    typeof conf.SERVER.PORT,
    'Configuration setting SERVER.PORT must be a number!',
  ],
  [
    'object',
    typeof conf.SERVER.HTTPS_CONFIG,
    'Configuration setting SERVER.HTTPS_CONFIG must be either an object (or null)!',
  ],
  [
    'object',
    typeof conf.SERVER.EXTRA_HEADERS,
    'Configuration setting SERVER.EXTRA_HEADERS must be either an object (or null)!',
  ],
  [
    'number',
    typeof conf.CLUSTER.WORKER_COUNT,
    'Configuration setting CLUSTER.WORKER_COUNT must be a number!',
  ],
  [
    'number',
    typeof conf.CLUSTER.WORKER_RESTARTS_MAX,
    'Configuration setting CLUSTER.WORKER_RESTARTS_ALLOWED must be a number!',
  ],
  [
    'number',
    typeof conf.CLUSTER.WORKER_RESTARTS_RESET_AFTER,
    'Configuration setting CLUSTER.WORKER_RESTARTS_ALLOWED must be a number!',
  ],
  [
    'number',
    typeof conf.CLUSTER.WORKER_RESTART_DELAY,
    'Configuration setting CLUSTER.WORKER_RESTART_DELAY must be a number!',
  ],
  [
    'boolean',
    typeof conf.REDIS.ENABLED,
    'Configuration setting REDIS.ENABLED must be a boolean!',
  ],
  [
    'string',
    typeof conf.REDIS.HOST,
    'Configuration setting REDIS.HOST must be a string!',
  ],
  [
    'number',
    typeof conf.REDIS.PORT,
    'Configuration setting REDIS.PORT must be a number!',
  ],
  [
    true,
    typeof conf.DATABASE.SYNC === 'boolean' || conf.DATABASE.SYNC === 'force',
    'Configuration setting DATABASE.SYNC must be a boolean or the string "force"!',
  ],
  [
    'string',
    typeof conf.DATABASE.HOST,
    'Configuration setting DATABASE.HOST must be a string!',
  ],
  [
    'string',
    typeof conf.DATABASE.HOST,
    'Configuration setting DATABASE.HOST must be a string!',
  ],
  [
    'number',
    typeof conf.DATABASE.PORT,
    'Configuration setting DATABASE.PORT must be a number!',
  ],
  [
    'string',
    typeof conf.DATABASE.USER,
    'Configuration setting DATABASE.USER must be a string!',
  ],
  [
    'string',
    typeof conf.DATABASE.PASS,
    'Configuration setting DATABASE.PASS must be a string!',
  ],
  [
    'string',
    typeof conf.DATABASE.SCHEMA,
    'Configuration setting DATABASE.SCHEMA must be a string!',
  ],
  [
    true,
    _.isPlainObject(conf.DATABASE.POOL_CONFIG),
    'Configuration setting DATABASE.POOL_CONFIG must be a plain object!',
  ],
  [
    true,
    _.isPlainObject(conf.DISABLED_MIDDLEWARES) && _.every(conf.DISABLED_MIDDLEWARES, _.isBoolean),
    'Configuration setting DISABLED_MIDDLEWARES must be a plain object of booleans!',
  ],
  [
    true,
    _.isPlainObject(conf.DISABLED_ROUTES) && _.every(conf.DISABLED_ROUTES, _.isBoolean),
    'Configuration setting DISABLED_ROUTES must be a plain object of booleans!',
  ],
];

/**
 * Used to coerce values, should a derived default be needed.
 * This uses the process.env syntax as keys, that is SERVER.PORT => SERVER_PORT.
 * @type {object<function>}
 */
const coercions = {
  CLUSTER_WORKER_COUNT: n => (n === 0 ? cpus().length - 1 : n),

  // Clamp the following in the range: [0, Number.Max_VALUE]
  CLUSTER_WORKER_RESTART_DELAY: finiteGreaterThanZero,
  CLUSTER_WORKER_RESTARTS_RESET_AFTER: finiteGreaterThanZero,
};

const coerce = (key, value) => (coercions[key] ? coercions[key](value) : value);

// Override default settings with environment variables.
// Sub-settings are joined with an underscore here, so the environment variable SERVER_PORT
// would be equivalent to SERVER.PORT.
walkObject(config, (value, key, parent, paths) => {
  if (!paths.length) return value;

  const property = `${paths.join('_')}_${key}`;
  const override = process.env[property];
  const which = _.isUndefined(override) ? value : override;
  const numeric = _.isString(which) ? Number(which) : NaN;

  return coerce(property, isNaN(numeric) ? which : numeric);
}, true);

// Validate all config values
validations(config).forEach(validation => assert.equal(...validation));

// Merge in derived configuration values
export default deepFreeze(Object.assign(config, constants, {
  WORKER_NUM: cluster.isMaster ? 0 : (cluster.worker.id % config.CLUSTER.WORKER_COUNT) + 1,
}));
