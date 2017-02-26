/**
 * Sets up the worker process. Including, starting the http server, initializing routes,
 * redis, sequelize, etc. and applying all app middlewares.
 * @file
 */

import _ from 'lodash';
import http from 'http';
import https from 'https';
import express from 'express';
import config from '../config';
import log from '../lib/logger';
import redis from '../lib/redis';
import models from '../database/models';
import middlewares from '../middlewares';
import routes from '../routes';
import heartbeat from '../lib/heartbeat';
import '../database/associations';

import { sortRoutes, validateRoute, has, hrtimeToMilliseconds } from '../lib/utils';

import {
  validateAppIdentifier,
  validateUserPermissions,
} from '../routewares';

process.title = config.PROCESS_TITLES.WORKER;

const {
  WORKER_NUM,
  APPLICATION_NAME,
  PROCESS_START,
  CONFIG_WARNINGS,
} = config;

const {
  HTTPS_OPTIONS,
  PORT,
  DISABLED_MIDDLEWARES,
  DISABLED_ROUTES,
} = config.SERVER;

const httpsEnabled = _.isObject(HTTPS_OPTIONS);

/**
 * Default route properties which are added to all routes if they are missing.
 * @type {object<any>}
 */
const DEFAULT_ROUTE_PROPS = {
  method: 'all',
  requiresValidAppId: true,
  permissions: [],
  specificity: 0,
};

const app = express();
const server = httpsEnabled
  ? https.createServer(HTTPS_OPTIONS, app)
  : http.createServer(app);

/**
 * Used by _.map to "convert" routes to a consumable data structure.
 * @param {Array|object} route The _.map value.
 * @param {string|number} category The _.map key.
 * @returns {Array|object}
 */
function digestRoute(route, category) {
  if (Array.isArray(route)) return route.map(rte => digestRoute(rte, category));
  return validateRoute({ ...DEFAULT_ROUTE_PROPS, ...route, category }, category);
}

/**
 * Wraps the given route callback with a try/catch and send error responses accordingly.
 * @param {function} callback The route callback to wrap
 * @returns {function} The wrapped route callback
 */
function middlewareWrapper(callback) {
  return async (req, res, ...rest) => {
    try {
      const context = { app, server, models };
      return await callback.call(context, req, res, ...rest);
    } catch (e) {
      // If the error didn't define a status, make it 500, and
      // in prod, redirect to /error, otherwise respond with the error contents.
      if (/^Sequelize/.test(e.name)) {
        e.status = 400;
      } else if (!has(e, 'status')) {
        e.status = 500;
      }

      return res.status(500).respond(e);
    }
  };
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
    : log.debug('Middleware "%s" initialized', name) || app.use(middlewareWrapper(middleware));
}

/**
 * Setups up the given route. A callback for routes.forEach().
 * @param {function} route The route object.
 * @param {string} name The name of the route (its export name).
 * @returns {undefined}
 */
function initializeRoute(route) {
  const { category, method, match, handler, requiresValidAppId, permissions } = route;
  const callback = middlewareWrapper(handler);

  const validateAppId = middlewareWrapper(validateAppIdentifier(requiresValidAppId));
  const validatePermissions = middlewareWrapper(validateUserPermissions(permissions));

  return DISABLED_ROUTES[category]
    ? log.warn('Skipping all "%s" routes (disabled by config)', category)
    : app[method.toLowerCase()](match, validateAppId, validatePermissions, callback);
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
  log.debug('%s Worker Bootstrapping', APPLICATION_NAME);
  if (CONFIG_WARNINGS.length) CONFIG_WARNINGS.forEach(msg => log.warn(msg));

  redis.init();

  // Setup express middlewares
  _.each(middlewares, initializeMiddleware);

  // Sort the routes by specificity then add them to the express app
  const processedRoutes = _.flatten(_.map(routes, digestRoute)).sort(sortRoutes);

  if (WORKER_NUM === 1) log.debug('Routes List:\n', processedRoutes);
  processedRoutes.forEach(initializeRoute);

  // Kick off the server
  await initializeServer();

  // Initialize heartbeat for worker
  heartbeat();

  const { address, family, port } = server.address();
  const connectionString = `http${httpsEnabled ? 's' : ''}://${family === 'IPv6' ? `[${address}]` : address}:${port}`;

  log.info(
    'Server initialized and listening on %s in %sms',
    connectionString,
    hrtimeToMilliseconds(process.hrtime(PROCESS_START), 2));
}

// Start the worker server
start().catch(e => process.nextTick(() => { throw e; }));
