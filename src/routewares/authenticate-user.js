/**
 * Checks for the "X-Application-Identifier"
 * @file
 */

import _ from 'lodash';
import unauthorized from '../routes/unauthorized';
import config from '../config';
import redis from '../lib/redis';
import { md5 } from '../lib/utils';

import {
  get as getJWT,
  del as delJWT,
  sign as signJWT,
  validate as validateJWT,
} from '../lib/jwt';

const { USER_TOKENS } = config.REDIS_PREFIXES;

/**
 * Matches the JWT token from the authorization header.
 * @type {RegExp}
 */
const AUTH_MATCHER = /^CJA:(\S+)$/;

async function setNextToken(user, res) {
  const response = res;
  const token = await signJWT({ store: true, data: user });
  redis.setAsync(redis.key(USER_TOKENS, md5(user.email)), token);
  response.nextToken = token;
}

/**
 * ...
 * @param {object} req The HTTP request object.
 * @param {object} res The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default function authenticateUserMiddleware(routeRequiresAuth) {
  return async function authenticateUser(req, res, next) {
    if (!routeRequiresAuth) return next();

    const request = req;
    const bounce = () => unauthorized.handler.call(this, request, res);

    // Grab Authorization header
    const { authorization } = req.headers;
    if (!authorization) return bounce();

    // Parse the JWT from the authorization header
    const token = (authorization.match(AUTH_MATCHER) || [])[1];
    if (!token) return bounce();

    // Validate the JWT
    const valid = validateJWT(token);
    if (_.isError(valid)) return bounce();

    // Get the user data from redis
    const session = await getJWT(token);
    if (!session) return bounce();

    // Session is valid
    request.user = session;
    delJWT(token);
    await setNextToken(request.user, res);
    return next();
  };
}
