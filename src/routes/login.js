/**
 * Routes related to user login.
 * @export
 */

import _ from 'lodash';
import redis from '../lib/redis';
import config from '../config';

import { User } from '../database/models';
import { hashUserPassword, md5 } from '../lib/utils';

import {
  get as getJWT,
  validate as validateJWT,
  sign as signJWT,
} from '../lib/jwt';

const { PASSWORD_HASH_ALGORITHM } = config.USER_ACCOUNTS;
const { USER_TOKENS } = config.REDIS_PREFIXES;

export default {
  // The method this route applies to.
  method: 'post',
  // The maximum requests per minute this route will response to, per ip
  maxRequestsPerMinute: 3,
  // Don't require authentication to login
  requiresAuth: false,
  // A string used to match routes (i.e app[method]([match]))
  match: '/login',
  // The app[method] callback handler
  handler: async (req, res) => {
    const response = res;
    const { email, password } = req.body;
    const ukey = redis.key(USER_TOKENS, md5(email));

    // Validate required fields
    if (!email || !password) {
      return response.status(401).respond({
        success: false,
        message: 'You must provide both an email and password to login',
      });
    }

    // Lookup the token from redis
    let token = await redis.getAsync(ukey);

    // User session already existed
    if (token) {
      const jwt = validateJWT(token);
      if (!_.isError(jwt)) {
        const user = await getJWT(token);
        response.nextToken = token;
        return response.respond({
          success: true,
          payload: user,
        });
      }
    }

    // Attempt to log the user in
    const pass = await hashUserPassword(password, email, PASSWORD_HASH_ALGORITHM);
    const record = await User.findOne({ where: { email, password: pass } });
    const user = record ? record.pretty() : null;

    // Account with email/password combo didn't exist
    if (!user) {
      return response.status(401).respond({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Valid user account, create a jwt
    token = await signJWT({ data: user, store: true });
    await redis.setAsync(ukey, token);
    response.nextToken = token;

    return response.respond({
      success: true,
      payload: user,
    });
  },
};
