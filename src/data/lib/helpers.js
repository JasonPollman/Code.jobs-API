import _ from 'lodash';
import redis from '../../lib/redis';
import constants from '../../lib/constants';
import { FIRST, PAGINATED } from './fields';

const GLOBAL_CACHE_PREFIX = constants.QUERY_CACHE_SETTINGS.GLOBAL_PREFIX;
const NOOP_IDENT = x => x;

/**
 * Caches data manager calls conforming to the { field: xxx, value: xxx } lookup interface.
 * @param {string} prefix The caching prefix string to prefix cache keys with.
 * @param {function} pre A function that can be used to mutate results.
 * @param {function} post A function that's invoked post caching.
 * @returns {function} A "postfetch" function.
 * @export
 */
export function cacheByFieldAndValue(prefix, pre = NOOP_IDENT, post = NOOP_IDENT) {
  return (data, input) => {
    const results = _.isFunction(pre) ? pre(data, input) : data;
    const key = `${GLOBAL_CACHE_PREFIX}:${prefix}:${input.field}:${input.value}`;

    if (results) redis.set(key, results);
    return post(results, input);
  };
}

/**
 * Looks up cache for routes conforming to the { field: xxx, value: xxx } lookup interface.
 * @param {string} prefix The caching prefix string to use to when looking up cache.
 * @param {function} post A function that's invoked post cache lookup.
 * @returns {function} A "prefetch" function.
 * @export
 */
export function getCachedByFieldAndValue(prefix, post = NOOP_IDENT) {
  return async (input) => {
    const key = `${GLOBAL_CACHE_PREFIX}:${prefix}:${input.field}:${input.value}`;
    return post(await redis.get(key), input);
  };
}

/**
 * Deletes cache for routes conforming to the { field: xxx, value: xxx } lookup interface.
 * @param {string} prefix The caching prefix string to use to when deleting cache.
 * @returns {function} A function bound to "prefix".
 * @export
 */
export function deleteAllCacheWithPrefixAndFields(prefix) {
  return (results) => {
    const keys = _.map(results, (value, field) => `${GLOBAL_CACHE_PREFIX}:${prefix}:${field}:${value}`);
    redis.delete(...keys);
    return results;
  };
}

/**
 * Reduces a return set to the first value if "input.first" is truthy.
 * @param {object} results The result set to reduce.
 * @param {object} input The input object.
 * @returns {any} The first, or all result values.
 * @export
 */
export function reduceToFirstValue(results, input) {
  const set = results || [];
  return input.first ? set[0] : results;
}

/**
 * Creates the [table]/get, and [table]/get-paginated data manager query executors.
 * @param {string} table The name of the table to create the executors for.
 * @param {string} prefix The caching prefix for the given table.
 * @returns {Array<object>} An array of database abstractor define objects.
 * @export
 */
export function createGetAndPaginatedQueries(table, prefix, noCache) {
  return [
    {
      script: `${table}/get`,
      prefetch: noCache
        ? reduceToFirstValue
        : getCachedByFieldAndValue(prefix, reduceToFirstValue),
      postfetch: noCache
        ? reduceToFirstValue
        : cacheByFieldAndValue(prefix, null, reduceToFirstValue),
      fields: {
        first: FIRST,
        field: { required: true, type: 'string' },
        value: { required: true },
      },
    },
    {
      script: `${table}/get-paginated`,
      fields: { first: FIRST, ...PAGINATED },
    },
  ];
}

export function lookupOnResultSetForTable(table) {
  return async (results) => {
    if (!results || results.affectedRows !== 1) return results;
    return await this.execute(`${table}/get`, {
      field: 'id',
      value: results.insertId,
    });
  };
}
