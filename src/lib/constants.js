/**
 * A set of universal constants used throughout this app.
 * @file
 */

import os from 'os';
import _ from 'lodash';
import assert from 'assert';
import { deepFreeze } from './utils';

const constants = deepFreeze({
  // The node environment
  NODE_ENV: process.env.NODE_ENV || 'production',
  // The number of worker processes to start
  WORKER_COUNT: parseInt(process.env.WORKER_COUNT, 10) || os.cpus().length,
  // Server options
  SERVER: {
    HTTPS: false,
    HTTPS_OPTIONS: {},
    PORT: parseInt(process.env.SERVER_PORT, 10) || 1337,
  },
  // Connection settings for MongoDB
  DATA: {
    HOST: process.env.DATA_HOST || 'localhost',
    PORT: parseInt(process.env.MONGO_PORT, 10) || 27017,
    USER: process.env.DATA_USER || null,
    PASS: process.env.DATA_PASS || null,
    DB: 'code-jobs-api',
  },
  // Connection settings for Redis
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  // Github OAuth app information
  GITHUB: {
    CLIENT_ID: '1ae66b37a16c134e4331',
    CLIENT_SECRET: '14fd7e0e4d4e5ad567b39cb2ac7032558e3c1871',
    CALLBACK_URL: 'http://127.0.0.1:1337/login/github/callback',
  },
});

// Validate basic constants
assert.equal(_.isNumber(constants.WORKER_COUNT), true, 'constants.WORKER_COUNT must have a numeric value!');
assert.equal(_.isNumber(constants.SERVER.PORT), true, 'constants.SERVER.PORT must have a numeric value!');
assert.equal(_.isNumber(constants.SERVER.PORT), true, 'constants.SERVER.PORT must have a numeric value!');

// Validate mongo constants
assert.equal(_.isNumber(constants.DATA.PORT), true, 'constants.DATA.PORT must have a numeric value!');
assert.equal(_.isString(constants.DATA.HOST), true, 'constants.DATA.HOST must have a string value!');
assert.equal(_.isString(constants.DATA.USER), true, 'constants.DATA.USER must have a string value!');
assert.equal(_.isString(constants.DATA.PASS), true, 'constants.DATA.PASS must have a string value!');

// Validate redis constants
assert.equal(_.isNumber(constants.REDIS.PORT), true, 'constants.REDIS.PORT must have a numeric value!');
assert.equal(_.isString(constants.REDIS.HOST), true, 'constants.REDIS.HOST must have a string value!');

export default constants;
