/**
 * A set of universal constants used throughout this app.
 * @file
 */

import os from 'os';
import _ from 'lodash';
import assert from 'assert';
import { deepFreeze } from './utils';

// Grab some values from environment variables for overrides.
const {
  NODE_ENV,
  DATA_HOST,
  DATA_USER,
  DATA_PASS,
  DATA_PORT,
  DATA_DB,
  REDIS_HOST,
  REDIS_PORT,
  SERVER_PORT,
  WORKER_COUNT,
} = process.env;

const constants = deepFreeze({
  // The node environment
  NODE_ENV: NODE_ENV || 'production',
  // The hostname of the local machine
  SERVER_HOSTNAME: os.hostname(),
  // The number of worker processes to start
  WORKER_COUNT: Math.max(1, parseInt(WORKER_COUNT, 10) || os.cpus().length),
  // The number of times to re-fork a worker if it dies
  MAX_WORKER_RETRYS: 3,
  // Server options
  SERVER: {
    HTTPS: false,
    HTTPS_OPTIONS: {},
    PORT: parseInt(SERVER_PORT, 10) || 1337,
  },
  // Connection settings for whatever data connection layer we're using
  DATA_LAYER: {
    HOST: DATA_HOST || 'localhost',
    PORT: parseInt(DATA_PORT, 10) || 3306,
    USER: DATA_USER || null,
    PASS: DATA_PASS || null,
    DB: DATA_DB || 'codejobs',
  },
  // Connection settings for Redis
  REDIS: {
    HOST: REDIS_HOST || 'localhost',
    PORT: parseInt(REDIS_PORT, 10) || 6379,
  },
  // Github OAuth app information
  GITHUB: {
    CLIENT_ID: '1ae66b37a16c134e4331',
    CLIENT_SECRET: '14fd7e0e4d4e5ad567b39cb2ac7032558e3c1871',
    CALLBACK_URL: 'http://127.0.0.1:1337/login/github/callback',
  },
  // Generic Cache settings
  QUERY_CACHE_SETTINGS: {
    GLOBAL_PREFIX: 'QUERY_CACHE',
    ROLES_PREFIX: 'QUERY_ROLES',
    USERS_PREFIX: 'QUERY_USERS',
    REQUESTS_PREFIX: 'QUERY_REQUESTS',
    RESPONSES_PREFIX: 'QUERY_RESPONSES',
  },
  DATA_LOGGING: {
    ENABLED: true,
    // Environments to log to the database in:
    ENVIRONMENTS: [
      'development',
      'production',
    ],
  },
});

// Validate basic constants
assert.equal(_.isNumber(constants.WORKER_COUNT), true, 'constants.WORKER_COUNT must have a numeric value!');
assert.equal(_.isNumber(constants.SERVER.PORT), true, 'constants.SERVER.PORT must have a numeric value!');

// Validate data layer constants
assert.equal(_.isNumber(constants.DATA_LAYER.PORT), true, 'constants.DATA.PORT must have a numeric value!');
assert.equal(_.isString(constants.DATA_LAYER.HOST), true, 'constants.DATA.HOST must have a string value!');
assert.equal(_.isString(constants.DATA_LAYER.USER), true, 'constants.DATA.USER must have a string value!');
assert.equal(_.isString(constants.DATA_LAYER.PASS), true, 'constants.DATA.PASS must have a string value!');
assert.equal(_.isString(constants.DATA_LAYER.DB), true, 'constants.DATA.DB must have a string value!');

// Validate redis constants
assert.equal(_.isNumber(constants.REDIS.PORT), true, 'constants.REDIS.PORT must have a numeric value!');
assert.equal(_.isString(constants.REDIS.HOST), true, 'constants.REDIS.HOST must have a string value!');

export default constants;
