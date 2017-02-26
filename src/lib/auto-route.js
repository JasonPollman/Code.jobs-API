/**
 * An abstraction around creating routes for models.
 * @file
 */

import _ from 'lodash';
import redis from './redis';
import config from '../config';
import log from './logger';

import { has, singular, plural, eStatus, NOOP_IDENT } from './utils';

const { ROUTE_CACHE } = config.CACHE_PREFIXES;
const { MAXIMUM_RECORD_COUNT } = config.DATABASE;

const QUERY_OPERATORS = ['$ne', '$in', '$not', '$notIn', '$gte', '$gt', '$lte', '$lt', '$like', '$ilike', '$notLike', '$notILike'];

/**
 * A set of CRUD optiation names.
 * @type {Array<string>}
 */
const CRUD_TYPES = ['create', 'retrieve', 'update', 'delete'];

/**
 * Attempts to find a model record from the redis cache. If it doesn't exist, it falls back
 * to looking up the record in the database. If a database lookup occurs, the result is passed
 * through the formatter function, cached, and then returned.
 * @param {string} field The cache field name (or attribute... typically id) used as a cache prefix.
 * @param {any} value The value of model attribue field.
 * @param {Sequelize.Model} model The sequelize model.
 * @param {string} name The model name
 * @param {object} [fOpts={}] Additional fetching options.
 * @param {function} [formatter=NOOP_IDENT] A function that formats records post retrieval.
 * @returns {object} The cached, or newly cached record.
 * @export
 */
export async function fetchCacheOrDBRecord(
  field, value, model, name, fOpts = {}, formatter = NOOP_IDENT) {
  const MODEL_NAME = name.toUpperCase();
  const FIELD = field.toUpperCase();

  // Attempt to get the record from redis, if it exists return it
  const cacheKey = redis.key(ROUTE_CACHE, MODEL_NAME, FIELD, value);
  const cached = await redis.getAsync(cacheKey);
  if (cached) return cached;

  // No cache, fetch from the database
  const record = await model.findOne({ ...fOpts, where: { [field]: value } });
  const result = record ? formatter(record.get({ plain: true })) : null;

  // Set the cache if the record indeed existed
  if (result) redis.setAsync(cacheKey, result);
  return result;
}

/**
 * Deletes all redis cache associated with the model with the id "id".
 * @param {Sequelize.Model} model The Sequelize model associated with the record with id "id".
 * @param {string} name The model's name.
 * @param {number} id The id of the model record to delete the cache for.
 * @returns {Promise} Resolves when redis cache deletion is complete.
 * @export
 */
export async function deleteAllCacheForRecordWithId(model, name, id) {
  // Grab the record from the cache or database
  const record = await fetchCacheOrDBRecord('id', id, model, name);
  if (!record) return undefined;

  // Generate a list of all the possible cache keys for this record.
  // O(n), where n is the number of model attribues the record contains.
  const attributes = model.rawAttributes;
  const onAttribute = (attributeValue, attribute) => (!_.isUndefined(record[attribute])
      ? redis.key(ROUTE_CACHE, name.toUpperCase(), attribute.toUpperCase(), record[attribute])
      : null);

  const keys = _.compact(_.map(attributes, onAttribute));
  log.debug('Model record deleted, keys invalidated => \n%s', JSON.stringify(keys, null, 2));
  return redis.delAsync(...keys);
}

/**
 * The handler for the /[model]/:id and /model/:field/:value routes.
 * @param {string} field The field bound to this handler (typically "id").
 * @param {Sequelize.Model} model The Sequelize model associated with this route handler.
 * @param {string} name The name of the model.
 * @param {object} fetchOptions Additional fetching options.
 * @param {function} formatter A function that formats records post database lookup.
 * @returns {function} An express route handler.
 * @export
 */
export function getFindOneHandler(field, model, name, fetchOptions, formatter) {
  return async (req, res) => {
    const value = req.params.field ? req.params.value : req.params[field];
    const payload = await fetchCacheOrDBRecord(field, value, model, name, fetchOptions, formatter);
    res.respond({ success: true, payload });
  };
}

/**
 * The handler for the /[model]s/ route.
 * THIS AUTO-ROUTE DOESN'T GET/SET ANY CACHE!
 * It does however provide additional order, limit, and offset search param options.
 * @param {Sequelize.Model} model The Sequelize model associated with this route handler.
 * @param {object} fetchOptions Additional fetching options.
 * @param {function} formatter A function that formats records post database lookup.
 * @returns {function} An express route handler.
 * @export
 */
export function getFindManyHandler(model, fetchOptions, formatter) {
  return async (req, res) => {
    // Get options for ordering and offset for the query params
    const { limit = 1000, offset = 0, orderBy = 'id', direction = 'DESC' } = req.query;
    const sortOptions = [orderBy, direction === 'ASC' ? 'ASC' : 'DESC'];
    const limitValue = _.clamp(Number(limit), 0, MAXIMUM_RECORD_COUNT) || MAXIMUM_RECORD_COUNT;
    const offsetValue = _.clamp(Number(offset), 0, Number.MAX_VALUE) || 0;

    // Get the list of operators for each where clause
    const operators = _.pickBy(req.query, (item, key) => {
      if (!_.startsWith(key, '$')) return false;
      if (!_.includes(QUERY_OPERATORS, item)) throw eStatus(400, `Bad query operator "${item}"`, 'QueryError');
      return true;
    });

    // Get the list of where clauses
    const where = _.mapValues(_.pickBy(req.query, (item, key) => has(model.rawAttributes, key)),
      (value, key) => {
        const operator = `$${key}`;
        const split = Array.isArray(value) ? value : value.split(',');
        return operators[operator] ? { [operators[operator]]: split } : value;
      });

    // Fetch records from the database
    const results = await model.findAll({
      ...fetchOptions,
      order: [sortOptions],
      limit: limitValue,
      offset: offsetValue,
      where,
    });

    res.respond({
      success: true,
      payload: results
        ? results.map(result => formatter(result.get({ plain: true })))
        : null,
    });
  };
}

/**
 * The handler for the /[model]s/:id/edit route.
 * @param {Sequelize.Model} model The Sequelize model associated with this route handler.
 * @param {string} modelName The name of the model.
 * @param {object} findOneHandler A findOneHandler to post create fetching.
 * @returns {function} An express route handler.
 * @export
 */
export function getUpdateHandler(model, modelName, findOneHandler) {
  return async (req, res) => {
    await Promise.all([
      deleteAllCacheForRecordWithId(model, modelName, req.params.id),
      model.update({ ...req.body, id: undefined }, { where: { id: req.params.id } }),
    ]);

    return findOneHandler(req, res);
  };
}

/**
 * The handler for the /[model]s/delete route.
 * @param {Sequelize.Model} model The Sequelize model associated with this route handler.
 * @param {string} modelName The name of the model.
 * @param {object} findOneHandler A findOneHandler to post create fetching.
 * @returns {function} An express route handler.
 * @export
 */
export function getDeleteHandler(model, modelName, confirmDelete = NOOP_IDENT) {
  return async (req, res) => {
    const { id } = req.params;

    try {
      // Call the user's delete confirmation method.
      confirmDelete(req.body);
    } catch (e) {
      return res.respond({
        success: false,
        message: e.message,
        payload: { deleted: false },
      });
    }

    // Delete the cache and the database record
    await Promise.all([
      deleteAllCacheForRecordWithId(model, modelName, id),
      model.destroy({ where: { id } }),
    ]);

    return res.respond({
      success: true,
      payload: { deleted: true },
      message: `${_.startCase(singular(modelName))} record with id ${id} deleted successfully.`,
    });
  };
}

/**
 * The handler for the /[model]s/create route.
 * @param {Sequelize.Model} model The Sequelize model associated with this route handler.
 * @param {string} modelName The name of the model.
 * @param {object} findOneHandler A findOneHandler to post create fetching.
 * @returns {function} An express route handler.
 * @export
 */
export function getCreateHandler(model, modelName, findOneHandler) {
  return async (req, res) => {
    const newRecord = await model.create({ ...req.body, id: undefined });
    const { dataValues } = newRecord;

    // Something went wrong creating the record.
    if (!_.isObject(newRecord) || !_.isObject(dataValues) || _.isNil(dataValues.id)) {
      return res.status(400).respond({ success: false, message: 'Error creating record.' });
    }

    const id = dataValues.id;
    // Ensure any old cache doesn't exist in the database
    await deleteAllCacheForRecordWithId(model, modelName, id);
    // New record was created, pre-fetch (cache) it and return the new (formatted) record.
    return findOneHandler({ ...req, params: { id } }, res);
  };
}

/**
 * Given a model, this method returns an array of cachable CRUD route objects.
 * @param {Sequelize.Model} model A Sequelize model.
 * @param {object} [fetchOptions={}] Fetch options typically passed to model.fetchOne, etc.
 * @param {object} [options={}] Routing options. An object that maps the CRUD type to
 * override route options.
 * @param {number=} options[CRUD type].specificity
 * The specificity for the respective CRUD operation's route.
 * @param {Array<string>=} options[CRUD type].permissions
 * An array of permissions needed to access the route.
 * @param {function=} options.retrieve.formatter
 * A formatter function that passes in the results of the database fetch and sends back
 * the return value of the "formatter" function.
 * @param {function=} options.delete.confirmDelete
 * A function that is passed in the delete request body. If it throws, nothing is deleted.
 * Useful in cases where a user might send back their password to confirm account deletion, etc.
 * @returns {Array<object>} An array of route objects to be imported into the worker server.
 * @export
 */
export default function createCachableCRUDRoutes(model, fetchOptions = {}, options = {}) {
  const mname = model.getTableName();
  const nameSingular = singular(mname);
  const namePlural = plural(mname);

  // Model names converted to the route convention
  const routeNameSingular = _.kebabCase(nameSingular);
  const routeNamePlural = _.kebabCase(namePlural);

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

  const findOneHandler = getFindOneHandler('id', model, namePlural, fetchingOptions, formatters.retrieve);

  // Setup all the routing options for each CRUD route
  const routes = {
    create: {
      permissions: [`create ${namePlural}`],
      specificity: 0,

      ...overrides.create,

      method: 'post',
      match: `/${routeNamePlural}/create`,
      handler: getCreateHandler(model, namePlural, findOneHandler),
    },
    update: {
      permissions: [`edit ${namePlural}`],
      specificity: 0,

      ...overrides.update,

      method: 'post',
      match: `/${routeNameSingular}/:id/edit`,
      handler: getUpdateHandler(model, namePlural, findOneHandler),
    },
    delete: {
      permissions: [`delete ${namePlural}`],
      specificity: 0,

      ...overrides.delete,
      confirmDelete: undefined,

      method: 'post',
      match: `/${routeNameSingular}/:id/delete`,
      handler: getDeleteHandler(model, namePlural, overrides.delete.confirmDelete),
    },
    retrieve: [
      {
        permissions: [`view ${namePlural}`],
        specificity: 0,

        ...overrides.retrieve,

        method: 'get',
        match: `/${routeNameSingular}/:id`,
        handler: findOneHandler,
      },
      {
        permissions: 'none',
        specificity: 0,

        ...overrides.retrieve,

        method: 'get',
        match: `/${routeNamePlural}`,
        handler: getFindManyHandler(model, fetchingOptions, formatters.retrieve),
      },
      {
        permissions: [`view ${namePlural}`],
        specificity: 0,

        ...overrides.retrieve,

        method: 'get',
        match: `/${routeNameSingular}/:field/:value`,
        handler: async (req, res) => {
          const { field, value } = req.params;
          const fOptions = { ...fetchingOptions, where: { [field]: value } };
          getFindOneHandler(field, model, namePlural, fOptions, formatters.retrieve)(req, res);
        },
      },
    ],
  };

  // Filter out any excluded routes...
  return _.flatten(_.toArray(_.filter(routes, (opts, route) => !excluded[route])));
}
