/**
 * Contains all of the JWT functionality
 * @file
 */

import jwt from 'jsonwebtoken';
import redis from './redis';
import config from '../config';
import { md5 } from '../lib/utils';

const {
  TOKEN_DATA,
} = config.REDIS_PREFIXES;

const {
  JWT_EXPIRY,
  JWT_SECRET,
  JWT_ISSUER,
  JWT_AUDIENCE,
} = config.SERVER;

const {
  ENABLED,
} = config.REDIS;

/**
 * If redis is disabled, we'll use local storage.
 * @type {Map}
 */
let localStorage;
if (!ENABLED) localStorage = new Map();

/**
 * Stores a JWT.
 * @param {string} token The token to use as the key.
 * @param {any} data The data to store.
 * @returns {Promise} Resolves when the JWT is stored.
 * @export
 */
export async function set(token, data) {
  const hash = md5(token);
  if (!ENABLED) return localStorage.set(hash, data);
  const key = redis.key(TOKEN_DATA, hash);
  return redis.setAsync(key, data);
}

/**
 * Deletes a stored JWT.
 * @param {string} token The token to use as the key.
 * @returns {Promise} Resolves when the JWT has been deleted.
 * @export
 */
export async function del(token) {
  const hash = md5(token);
  if (!ENABLED) return localStorage.delete(hash);
  const key = redis.key(TOKEN_DATA, hash);
  return redis.delAsync(key);
}

/**
 * Gets a stored a JWT.
 * @param {string} token The token to use as the key.
 * @returns {Promise} Resolves with the JWT data.
 * @export
 */
export async function get(token) {
  const hash = md5(token);
  if (!ENABLED) return localStorage.get(hash) || null;
  const key = redis.key(TOKEN_DATA, hash);
  return redis.getAsync(key);
}

/**
 * Create a JWT token.
 * @param {object} [options={}] Options used in token creation.
 * @returns {string} The signed JWT token.
 * @export
 */
export async function sign(options = {}) {
  const { data, store, expiry = JWT_EXPIRY } = options;

  // Create the JWT token using the configuration settings.
  const token = jwt.sign({}, JWT_SECRET, {
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
    expiresIn: expiry,
  });

  if (store) await set(token, data);
  return token;
}

/**
 * Validates a user token.
 * @param {string} token The JWT to validate.
 * @returns {any} The token data, if the token was valid.
 * If invalid, an error corresponding to why the token was invalid.
 * @see: https://www.npmjs.com/package/jsonwebtoken#errors--codes
 * @throws {TokenExpiredError|JsonWebTokenError}
 * @export
 */
export function validate(token) {
  try {
    // Attempt to validate the token and return the token data
    return jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch (e) {
    del(token);
    return e;
  }
}

