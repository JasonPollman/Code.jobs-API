import _ from 'lodash';
import redis from './redis';
import config from '../config';
import { has, singular, plural, NOOP_IDENT } from './utils';

const { ROUTE_CACHE } = config.CACHE_PREFIXES;
const { MAXIMUM_RECORD_COUNT } = config.DATABASE;

/**
 * A set of CRUD optiation names.
 * @type {Array<string>}
 */
const CRUD_TYPES = ['create', 'retrieve', 'update', 'delete'];

export async function getCachedOrFetchFromDB(id, modelName, model, fetchingOptions, formatter) {
  // Attempt to get the record from redis, if it exists return it
  const key = redis.key(ROUTE_CACHE, modelName.toUpperCase(), id);
  const cached = await redis.getAsync(key);
  if (cached) return cached;

  // No cache, fetch from the database
  const record = await model.findOne({ ...fetchingOptions, where: { id } });
  const result = record ? formatter(record.get({ plain: true })) : null;

  // Set the cache if the record indeed existed
  if (result) redis.setAsync(key, result);
  return result;
}

export function deleteModelCacheWithId(modelKey, id) {
  return redis.delAsync(redis.key(ROUTE_CACHE, modelKey.toUpperCase(), id));
}

export function getFindOneHandler(model, modelName, fetchOptions, formatter) {
  return async (req, res) => {
    const { id } = req.params;
    res.respond({
      success: true,
      payload: await getCachedOrFetchFromDB(id, modelName, model, fetchOptions, formatter),
    });
  };
}

export function getFindManyHandler(model, fetchOptions, formatter) {
  return async (req, res) => {
    // Get options for ordering and offset for the query params
    const { limit = 1000, offset = 0, orderBy = 'id', direction = 'DESC' } = req.query;
    const sortOptions = [orderBy, direction === 'ASC' ? 'ASC' : 'DESC'];
    const limitValue = _.clamp(Number(limit), 0, MAXIMUM_RECORD_COUNT) || MAXIMUM_RECORD_COUNT;
    const offsetValue = _.clamp(Number(offset), 0, Number.MAX_VALUE) || 0;

    // Fetch records from the database
    const results = await model.findAll({
      ...fetchOptions,
      order: [sortOptions],
      limit: limitValue,
      offset: offsetValue,
    });

    res.respond({
      success: true,
      payload: results
        ? results.map(result => formatter(result.get({ plain: true })))
        : null,
    });
  };
}

export function getUpdateHandler(model, modelKey, findOneHandler) {
  return async (req, res) => {
    await Promise.all([
      deleteModelCacheWithId(modelKey, req.params.id),
      model.update(req.body, { where: { id: req.params.id } }),
    ]);

    return findOneHandler(req, res);
  };
}

export function getDeleteHandler(model, modelKey) {
  return async (req, res) => {
    const { id } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      return res.respond({
        success: true,
        message: 'No confirmation',
        payload: { deleted: false },
      });
    }

    await Promise.all([
      deleteModelCacheWithId(modelKey, id),
      model.destroy({ where: { id } }),
    ]);

    return res.respond({ success: true, payload: { deleted: true } });
  };
}

export function getCreateHandler(model, findOneHandler) {
  return async (req, res) => {
    await model.create(req.body);
    return findOneHandler(req, res);
  };
}

export default function autoGenerateCachableCRUDRoutes(model, fetchOptions = {}, options = {}) {
  const mname = model.getTableName();
  const nameSingular = singular(mname);
  const namePlural = plural(mname);

  let fetchingOptions = fetchOptions;
  let overrides = options;

  // Allow fetchingOptions to be optional
  if (!overrides && _.isPlainObject(fetchingOptions)) {
    overrides = fetchingOptions;
    fetchingOptions = {};
  }

  // Prevent from mutating arguments
  overrides = { ...overrides };
  fetchingOptions = _.isPlainObject(fetchingOptions) ? fetchingOptions : {};

  // A mapping of the CRUD type to the a result formatting function
  const formatters = {};
  // A mapping of the CRUD type to excluded routes. If a route is excluded,
  // it will be filtered out before being returned.
  const excluded = {};

  CRUD_TYPES.forEach((type) => {
    // Ensure we have a base object
    if (!has(overrides, type)) overrides[type] = {};
    const { exclude, formatResults } = overrides[type];

    // The formatter and exclude option for this CRUD type
    formatters[type] = _.isFunction(overrides[type].formatResults) ? formatResults : NOOP_IDENT;
    excluded[type] = exclude;

    // Cleanup, as these will be spread to its respective route options
    delete overrides[type].formatResults;
    delete overrides[type].disabled;
  });

  const findOneHandler = getFindOneHandler(model, namePlural, fetchingOptions, formatters.retrieve);

  // Setup all the routing options for each CRUD route
  const routes = {
    create: {
      permissions: 'none',
      specificity: 0,

      ...overrides.create,

      method: 'post',
      match: `/${namePlural}`,
      handler: getCreateHandler(model, findOneHandler),
    },
    update: {
      permissions: 'none',
      specificity: 0,

      ...overrides.update,

      method: 'post',
      match: `/${nameSingular}/:id/edit`,
      handler: getUpdateHandler(model, namePlural, findOneHandler),
    },
    delete: {
      permissions: 'none',
      specificity: 0,

      ...overrides.delete,

      method: 'post',
      match: `/${nameSingular}/:id/delete`,
      handler: getDeleteHandler(model, namePlural),
    },
    retrieve: [
      {
        permissions: 'none',
        specificity: 0,

        ...overrides.retrieve,

        method: 'get',
        match: `/${nameSingular}/:id`,
        handler: findOneHandler,
      },
      {
        permissions: 'none',
        specificity: 0,

        ...overrides.retrieve,

        method: 'get',
        match: `/${namePlural}`,
        handler: getFindManyHandler(model, fetchingOptions, formatters.retrieve),
      },
      {
        permissions: 'none',
        specificity: 0,

        ...overrides.retrieve,

        method: 'get',
        match: `/${nameSingular}/:field/:value`,
        handler: async (req, res) => {
          const { field, value } = req.params;
          const fOptions = { ...fetchingOptions, where: { [field]: value } };
          getFindOneHandler(model, namePlural, fOptions, formatters.retrieve)(req, res);
        },
      },
    ],
  };

  return _.flatten(_.toArray(_.filter(routes, (opts, route) => !excluded[route])));
}
