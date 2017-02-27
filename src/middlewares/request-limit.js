/**
 * Sets basic headers for all routes.
 * @file
 */

import redis from '../lib/redis';
import config from '../config';

const { REQUESTS_PER_MINUTE_LIMIT } = config.SERVER;
const { REQUESTS_PER_MINUTE } = config.REDIS_PREFIXES;
const allowed = REQUESTS_PER_MINUTE_LIMIT > 0 ? REQUESTS_PER_MINUTE_LIMIT : 'Inifinty';

/**
 * Sets header information about the total and remaining requests.
 * @param {object} response The HTTP response object.
 * @param {number} remaining The number of remaining requests.
 */
function setRequestLimitHeaders(response, remaining) {
  response.header('X-Request-Limit', allowed);
  response.header('X-Requests-Remaining', remaining);
}

/**
 * Limits the number of requests per minute per ip.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @param {function} next Calls the next handler on the request stack.
 * @export
 */
export default async function limitRequests(request, response, next) {
  if (REQUESTS_PER_MINUTE_LIMIT <= 0) {
    setRequestLimitHeaders(response, 'Infinity');
    return next();
  }

  const now = Date.now();
  const key = redis.key(REQUESTS_PER_MINUTE, request.ip);
  const prev = (await redis.getAsync(key)) || { time: now, value: 0 };

  // Reset the value if the last time it was set was more than 1 minute in the past.
  if (now - prev.time > 60000) prev.value = 0;

  const curr = { ...prev, value: prev.value + 1 };
  const used = curr.value;

  // Set the new request total for the current ip
  await redis.setAsync(key, curr);
  setRequestLimitHeaders(response, REQUESTS_PER_MINUTE_LIMIT - used);

  // Send back a warning the first time exceeded
  if (used === REQUESTS_PER_MINUTE_LIMIT + 1) {
    return response.status(429).respond({ success: false });
  }

  // Still within request limit
  if (used <= REQUESTS_PER_MINUTE_LIMIT) return next();

  // Ignore the request
  return undefined;
}
