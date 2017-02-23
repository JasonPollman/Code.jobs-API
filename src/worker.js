/**
 * Sets up the worker process. Including, starting the http server, initializing routes,
 * redis, sequelize, etc. and applying all app middlewares.
 * @file
 */

import _ from 'lodash';
import http from 'http';
import https from 'https';
import express from 'express';
import config from './config';
import log from './lib/logger';
import { sortRoutes, validateRoute, has } from './lib/utils';

import { init as initializeDatabase } from './lib/sequelize';
import { init as initializeRedis } from './lib/redis';

import middlewares from './middlewares';
import routes from './routes';
import models from './models';

process.title = config.PROCESS_TITLES.WORKER;

const { DISABLED_MIDDLEWARES, DISABLED_ROUTES, NODE_ENV, WORKER_NUM } = config;
const { HTTPS_OPTIONS, PORT } = config.SERVER;

/**
 * Default route properties which are added to all routes if they are missing.
 * @type {object<any>}
 */
const DEFAULT_ROUTE_PROPS = {
  method: 'all',
  permission: 'none',
  specificity: 0,
};

const app = express();
const server = _.isObject(HTTPS_OPTIONS)
  ? https.createServer(HTTPS_OPTIONS, app)
  : http.createServer(app);

/**
 * Used by _.map to "convert" routes to a consumable data structure.
 * @param {Array|object} route The _.map value.
 * @param {string|number} category The _.map key.
 * @returns {Array|object}
 */
function digestRoute(route, category) {
  if (Array.isArray(route)) return route.map(digestRoute);
  return validateRoute({ ...DEFAULT_ROUTE_PROPS, ...route, category }, category);
}

/**
 * Setups up the given middleware. A callback for _.each(middlewares).
 * @param {function} middleware The middleware function.
 * @param {string} name The name of the middleware (its export name).
 * @returns {undefined}
 */
function initializeMiddleware(middleware, name) {
  return DISABLED_MIDDLEWARES[name]
    ? log.debug('Skipping middleware "%s" (disabled by config)', name)
    : log.debug('Middleware "%s" initialized', name) || app.use(middleware);
}

/**
 * Wraps the given route callback with a try/catch and send error responses accordingly.
 * @param {function} callback The route callback to wrap
 * @returns {function} The wrapped route callback
 */
function createWrappedRouteCallback(callback) {
  return async (req, res, ...rest) => {
    try {
      return await callback.call(app, req, res, ...rest);
    } catch (e) {
      // If the error didn't define a status, make it 500, and
      // in prod, redirect to /error, otherwise respond with the error contents.
      if (!has(e, 'status')) e.status = 500;
      return NODE_ENV !== 'production' ? res.status(500).respond(e) : res.redirect('/error');
    }
  };
}

/**
 * Setups up the given route. A callback for routes.forEach().
 * @param {function} route The route object.
 * @param {string} name The name of the route (its export name).
 * @returns {undefined}
 */
function initializeRoute(route) {
  const { category, method, match, handler } = route;
  return DISABLED_ROUTES[category]
    ? log.warn('Skipping all "%s" routes (disabled by config)', category)
    : app[method.toLowerCase()](match, createWrappedRouteCallback(handler));
}

/**
 * Starts the server and waits for the server port to be bound and listening.
 * @returns {Promise} Resolves once the server is listening, rejects on error.
 */
function initializeServer() {
  const startupPromise = new Promise((resolve, reject) => {
    const removeErrorListener = () => server.removeListener('error', reject);
    const removeBoundListener = () => server.removeListener('listening', resolve);

    server
      // Resolve on successful port binding, reject on error
      .once('listening', resolve)
      .once('error', reject)

      // Remove the opposite listener on each event, respectively.
      .once('listening', removeErrorListener)
      .once('error', removeBoundListener);
  });

  server.listen(PORT);
  return startupPromise;
}

/**
 * Kicks off the worker process.
 * @returns {Promise} Resolves when all worker initialization tasks are complete.
 */
async function start() {
  // Startup the database and redis
  await Promise.all([
    initializeDatabase(),
    initializeRedis(),
  ]);

  // Setup CRUD routes for each model
  // Iterate over each model, and setup routes if they're included.
  const databaseRoutes = [];

  _.each(models, (model) => {
    if (!_.isObject(model.definition.routes)) return;
    const category = _.camelCase(`Model ${model.definition.name}`);
    databaseRoutes.push(digestRoute(model.definition.routes, category));
  });

  // Setup express middlewares
  _.each(middlewares, initializeMiddleware);

  // Sort the routes by specificity then add them to the express app
  const formattedRoutes = _.flatten(_.map(routes, digestRoute)
    .concat(databaseRoutes))
    .sort(sortRoutes);

  if (WORKER_NUM === 1) log.debug('Routes List:\n', formattedRoutes);
  formattedRoutes.forEach(initializeRoute);

  // Kick off the server
  await initializeServer();

  log.info('Server now listening on port %s', PORT);
}

// Start the worker server
start().catch(e => process.nextTick(() => { throw e; }));
