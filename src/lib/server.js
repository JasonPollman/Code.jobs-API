import http from 'http';
import https from 'https';
import express from 'express';
import _ from 'lodash';
import debuggr from 'debug';
import morgan from 'morgan';
import fs from 'fs-extra-promise';
import path from 'path';
import ConnectRoles from 'connect-roles';

import { inspect, sortRoute } from './utils';
import constants from './constants';

import middlewares from '../middlewares';
import routes from '../routes';

const debug = debuggr('api-server');
morgan.token('worker', () => process.pid);

/**
 * A mapping of logging formats for node environments.
 * @type {object<string>}
 */
const loggingFormats = {
  default: 'combined',
  production: 'combined',
  development: 'Worker :worker - :method :url :status :response-time ms - :res[content-length]',
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
 * Defines how unauthorized accesses to routes are handled.
 * @param {Request} req A request object.
 * @param {Response} res A response object.
 * @returns {undefined}
 */
export function permissionFailureHandler(req, res) {
  res.status(401).json({ message: 'Unauthorized', success: false });
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
    _.each(options, (option, name) => {
      if (_.isUndefined(option)) return;

      Object.defineProperty(this, name, {
        configurable: false,
        writable: false,
        enumerable: true,
        value: option,
      });
    });

    debug('Server created with options: %s', inspect(options));

    // Express instance
    this.app = express();

    // Create http or https server based on options
    this.http = options.https
      ? https.createServer(httpsOptions, this.app)
      : http.createServer(this.app);

    // Setup user roles
    this.user = new ConnectRoles({ failureHandler: permissionFailureHandler });
    this.app.use(this.user.middleware());

    // Only allow unauthenticated users to "access home page"
    this.user.use((req, action) => {
      if (!req.isAuthenticated) return action === 'access home page';
      return true;
    });
  }

  /**
   * Starts the HTTP Server instance.
   * @returns {undefined}
   */
  async start() {
    // Server already listening
    if (this.http.listening) return null;
    debug('Server starting on port: %s', this.port);
    const promises = [];

    promises.push(
      // Setup server listeners
      new Promise((resolve, reject) => {
        const onError = e => reject(e);
        const onListen = () => resolve();

        // Handles when the server starts listening
        // Resolve this promise and remove the error handler
        this.http.on('listening', () => {
          debug('Server now listening port: %s', this.port);
          this.http.removeListener('error', onError);
          onListen();
        });

        // Handles when the server encounters an initial error.
        // Rejects this promise and remove the listening handler.
        this.http.on('error', (e) => {
          debug('Error starting server: %s', e.message);
          this.http.removeListener('listening', onError);
          onError(e);
        });
      }),
      // Setup logging
      new Promise(async (resolve, reject) => {
        try {
          await fs.ensureDirAsync(this.loggingDirectory);
          const loggingDestination = path.join(this.loggingDirectory, this.loggingFilename);
          const stream = fs.createWriteStream(loggingDestination, {
            flags: 'a',
            defaultEncoding: 'utf8',
          });

          // Setup stdout/file logging
          this.app.use(morgan(this.loggingFormat, { stream }));
          this.app.use(morgan(this.loggingFormat));

          // Setup middlewares
          _.each(middlewares, middleware => this.app.use(middleware));

          // Define all routes
          _.each(_.toArray(routes).sort(sortRoute), (route) => {
            const { match, handler, permission } = route;

            // If a permission was defined, check that the user has the permission,
            // else just call the route handler.
            return permission && permission !== 'none'
              ? this.app[route.method.toLowerCase()](match, this.user.can(permission), handler)
              : this.app[route.method.toLowerCase()](match, handler);
          });

          resolve(this);
        } catch (e) {
          reject(e);
        }
      }),
    );

    this.http.listen(this.port);
    return await Promise.all(promises);
  }

  /**
   * Stops the HTTP Server instance
   * @returns {undefined}
   */
  async stop() {
    // Server not started yet...
    if (!this.http.listening) return;

    debug('Stopping server on port: %s', this.port);
    await new Promise(resolve => this.http.close(resolve));
  }
}
