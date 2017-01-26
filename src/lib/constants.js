/**
 * A set of universal constants used throughout this app.
 * @file
 */

import _ from 'lodash';
import assert from 'assert';
import { deepFreeze } from './utils';

const constants = deepFreeze({
  // The node environment
  NODE_ENV: process.env.NODE_ENV || 'production',
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
});

// Validate mongo constants
assert.equal(_.isNumber(constants.DATA.PORT), true, 'constants.DATA.PORT must have a numeric value!');
assert.equal(_.isString(constants.DATA.HOST), true, 'constants.DATA.HOST must have a string value!');
assert.equal(_.isString(constants.DATA.USER), true, 'constants.DATA.USER must have a string value!');
assert.equal(_.isString(constants.DATA.PASS), true, 'constants.DATA.PASS must have a string value!');

// Validate redis constants
assert.equal(_.isNumber(constants.REDIS.PORT), true, 'constants.REDIS.PORT must have a numeric value!');
assert.equal(_.isString(constants.REDIS.HOST), true, 'constants.REDIS.HOST must have a string value!');

export default constants;
