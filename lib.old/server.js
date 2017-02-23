import http from 'http';
import https from 'https';
import express from 'express';
import _ from 'lodash';
import debuggr from 'debug';
import path from 'path';
import ConnectRoles from 'connect-roles';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import passport from 'passport';
import cluster from 'cluster';

import { sortRoutes, has, IMMUTABLE_VISIBLE } from './utils';
import constants from './constants';

import middlewares from '../middlewares';
import routes from '../routes';
import modelRoutes from '../models';

const debug = debuggr(`api:server:${cluster.isMaster ? 'master' : 'worker'}:${process.pid}`);

/**
 * A mapping of logging formats for node environments.
 * @type {object<string>}
 */
const loggingFormats = {
  default: 'combined',
  production: 'combined',
  development: 'combined',
};

/**
 * Default options for each Server instance.
 * @type {object<any>}
 */
const DEFAULT_OPTIONS = {
  // Uses HTTPS if true
  https: false,
  // The options to pass to https.createServer([options])
  httpsOptions: {},
  // The port to start the server on
  port: 1337,
  // The morgan logging format:
  loggingFormat: loggingFormats[constants.NODE_ENV] || loggingFormats.default,
  // The directory to output log files to
  loggingDirectory: path.join(process.cwd(), 'http-logs'),
  // The filename to log to
  loggingFilename: 'api-server-[month]-[date]-[year].log',
};


/**
 * Wraps each route handler with a try/catch.
 * @param {function} handler The route handler to wrap.
 * @returns {function} The wrapped route handler.
 */
function wrapRouteHandler(server, handler) {
  return async (req, res, ...rest) => {
    try {
      return await handler.call(server.app, req, res, ...rest);
    } catch (e) {
      // If the error didn't define a status, make it 500.
      if (!has(e, 'status')) e.status = 500;

      // In prod, redirect to /error, otherwise responsd with the error contents.
      return constants.NODE_ENV !== 'production'
        ? res.status(500).respond(e)
        : res.redirect('/error');
    }
  };
}

/**
 * Defines a route on server "server".
 * @param {Server} server The Server object to define the route for.
 * @param {object} route The route definition object.
 * @returns {undefined}
 */
function defineRoute(server, route) {
  const { method = 'all', match, handler, permission } = route;

  // Setup route permission middleware
  const perm = _.isString(permission) ? _.kebabCase(permission).toLowerCase() : 'none';
  const checkPermission = server.user.can(perm);
  const fn = method.toLowerCase();

  debug('Initializing route %O %O', method.toUpperCase(), match);
  server.app[fn](match, checkPermission, wrapRouteHandler(server, handler));
}

/**
 * Initializes (adds) all the middlewares from the ../middlewares file to the server.
 * @param {Server} server The Server object to add the middlewares to.
 * @returns {undefined}
 */
function initializeMiddlewares(server) {
  _.each(middlewares, (middleware, name) => {
    debug('Initializing middleware %O', name);
    server.app.use(middleware);
  });
}

/**
 * Creates a promise that resolves when the server is done listening.
 * @param {any} server The server to wait for the "listening" event on.
 * @returns {Promise} Resolves once the server is listening, or rejects on "error".
 */
function waitForServerToListen(server) {
  return new Promise((resolve, reject) => {
    const onError = e => reject(e);
    const onListen = () => resolve();

    // Handles when the server starts listening
    // Resolve this promise and remove the error handler
    server.http.on('listening', () => {
      debug('Server now listening port: %O', server.port);
      server.http.removeListener('error', onError);
      onListen();
    });

    // Handles when the server encounters an initial error.
    // Rejects this promise and remove the listening handler.
    server.http.on('error', (e) => {
      debug('Error starting server: %O', e);
      server.http.removeListener('listening', onError);
      onError(e);
    });
  });
}

/**
 * Defines how unauthorized accesses to routes are handled.
 * @param {object} request The HTTP request object.
 * @param {object} response The HTTP response object.
 * @returns {undefined}
 */
export function permissionFailureHandler(request, response) {
  response.redirect('/unauthorized');
}

export function permissionHandler(req, action) {
  return true;
}

/**
 * An HTTP Server Abstraction
 * @export
 * @class Server
 */
export default class Server {
  constructor(opts = {}) {
    // Merge options with default options
    const options = _.merge({}, DEFAULT_OPTIONS, _.isObject(opts) ? opts : {});
    const { httpsOptions, loggingFilename } = options;

    // Replace tokens on logging filename
    const d = new Date();
    options.loggingFilename = loggingFilename
      .replace(/\[month\]/g, d.getMonth() + 1)
      .replace(/\[date\]/g, d.getDate())
      .replace(/\[year\]/g, d.getFullYear());

    // Assign all option values to this object
    _.each(options, (value, name) =>
      Object.defineProperty(this, name, { ...IMMUTABLE_VISIBLE, value }));

    this.app = express();

    // Create http or https server based on options
    this.http = options.https
      ? https.createServer(httpsOptions, this.app)
      : http.createServer(this.app);

    // Setup user roles, function failureHandler defines what happens when a user is unauthorized.
    this.user = new ConnectRoles({ failureHandler: permissionFailureHandler });
    this.user.use(permissionHandler);

    // Basic middlwares for authentication, body parsing, etc.
    this.app.use(this.user.middleware());
    this.app.use(cookieParser());
    this.app.use(bodyParser.json({ type: 'application/*+json' }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(expressSession({ secret: 'gW45V1GvmVZs4T', resave: false, saveUninitialized: false }));
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  /**
   * Starts the HTTP Server instance.
   * @returns {undefined}
   */
  async start() {
    if (this.http.listening) return null;
    initializeMiddlewares(this);

    // Flatten out all routes, sort them by specificity,
    // and add them to the server express app.
    _.flatten(_.toArray(routes).concat(_.toArray(modelRoutes)))
      .sort(sortRoutes)
      .forEach(route => defineRoute(this, route));

    this.http.listen(this.port);
    return await waitForServerToListen(this);
  }

  /**
   * Stops the HTTP Server instance
   * @returns {undefined}
   */
  async stop() {
    if (!this.http.listening) return;
    debug('Stopping server on port: %O', this.port);
    await new Promise(resolve => this.http.close(resolve));
  }
}
