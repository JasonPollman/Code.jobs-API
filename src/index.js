/**
 * The application main entry point.
 * Starts the master process.
 * @file
 */

import _ from 'lodash';
import path from 'path';
import cluster from 'cluster';
import config from './config';
import log from './lib/logger';
import setup from './lib/setup';
import sequelize from './database';
import models from './database/models';
import './database/associations';

process.title = config.PROCESS_TITLES.MASTER;

cluster.setupMaster({
  exec: path.join(__dirname, 'worker'),
  stdio: 'inherit',
});

const {
  FIRST_RUN,
  NODE_ENV,
  APPLICATION_NAME,
} = config;

const {
  WORKER_COUNT,
  WORKER_DELAY_BETWEEN_SPAWNS,
  WORKER_RESTART_DELAY,
  WORKER_RESTARTS_RESET_AFTER,
  WORKER_RESTARTS_MAX,
  WORKER_MIN_ALLOWED,
} = config.CLUSTER;

const {
  SYNC,
} = config.DATABASE;

/**
 * @returns {number} The number of milliseconds the master process has been running.
 * @function
 */
const uptime = () => process.uptime() * 1000;

/**
 * Gets the "worker number". A number that represents the worker in regard to it's "place".
 * This differs from id as the id will always grow as new workers are forked. The "number"
 * is the id % the total worker count.
 * @returns {number} The worker number for the given worker.
 * @function
 */
const getWorkerNumber = worker => (worker.id % WORKER_COUNT) + 1;

/**
 * Stores the number of times each worker has been restarted and the associated
 * fork count reset timeout.
 * @type {Map}
 */
const restarts = new Map();

/**
 * Handles reforking of workers when they die.
 *
 * A worker is only allowed to be reforked if:
 * - The process uptime is > WORKER_RESTART_DELAY and
 * - The number of restarts for the worker number is < WORKER_RESTARTS_MAX
 *
 * The number of restarts for each worker will be reset after WORKER_RESTARTS_RESET_AFTER,
 * if this value is a positive integer > 0.
 * @param {ChildProcess} worker The child process of the worker that's died.
 * @returns {undefined}
 */
function onWorkerExit(worker, code) {
  const num = getWorkerNumber(worker);
  // Process hasn't been alive long enough, just let the error be thrown.
  if (uptime() <= WORKER_RESTART_DELAY) {
    throw new Error(`Worker number ${num} died (code ${code})`);
  }

  // Get the worker number and setup the restart reference object.
  const ref = restarts.get(num) || { forks: 0, timeout: null };
  restarts.set(num, ref);

  clearTimeout(ref.timeout);
  if (WORKER_RESTARTS_RESET_AFTER > 0) {
    const reset = () => { ref.forks = 0; };
    ref.timeout = setTimeout(reset, WORKER_RESTARTS_RESET_AFTER);
  }

  // Check to see if this worker has exceeded the maximum number of restarts,
  // if so, return, otherwise fork a replacement worker (which will have the
  // same worker number as the now dead one).
  if (WORKER_RESTARTS_MAX > 0 && ref.forks >= WORKER_RESTARTS_MAX) {
    log.error('Worker %s has exhausted it\'s spawn allocations (%s). It will not be reforked.', num, ref.forks + 1);
    const alive = Object.keys(cluster.workers).length;

    if (alive === 0) {
      // No workers remaining
      throw new Error('All workers have exhausted their spawn allocations. No workers remaining. Exiting...');
    }

    if (alive < WORKER_MIN_ALLOWED) {
      // Fallen below the worker minimum allowed threshold
      throw new Error(`Too few workers (${alive} alive, ${WORKER_MIN_ALLOWED} needed). Exiting...`);
    }

    return;
  }

  log.warn('Worker number %s died, forking replacement (%s total forks)', num, ref.forks += 1);
  cluster.fork();
}

/**
 * Forks all worker processes
 * @returns {undefined}
 */
function forkWorkers() {
  log.debug('Forking %s workers', WORKER_COUNT);
  for (let i = 0; i < WORKER_COUNT; i++) {
    setTimeout(() => cluster.fork(), i * WORKER_DELAY_BETWEEN_SPAWNS);
  }
}

/**
 * Bootstraps the cluster workers.
 * @returns {undefined}
 */
async function bootstrapCluster() {
  let online = 0;

  // Called when a worker is online
  const onlineCallback = () => {
    if (++online === WORKER_COUNT) {
      cluster.removeListener('online', onlineCallback).emit('bootstrapped');
    }
  };

  cluster.on('online', onlineCallback);
  const bootstrapPromise = new Promise(resolve => cluster.on('bootstrapped', resolve));
  forkWorkers();

  await bootstrapPromise;
  log.info('All (%s) workers bootstrapped successfully...', WORKER_COUNT);
}

/**
 * Syncs database tables.
 * @param {boolean=} [force=false] If true, tables will be dropped and recreated.
 * @returns {Promise} Resolves when database syncing is complete.
 * @export
 */
export function sync(force = false) {
  log.debug('Syncing database tables (enabled by config, force=%s)', force);
  return sequelize.sync({ force });
}

/**
 * Syncs the database tables if config.DATABASE.SYNC is truthy.
 * @returns {Promise<Sequelize>} Resolves with the Sequelize connection instance.
 * @export
 */
export async function initializeDatabase() {
  // Sync database tables (make sure this is only done by master process!)
  if (SYNC) await sync(SYNC === 'force');
  log.debug('Sequelize initialized');
}

/**
 * Starts the cluster.
 * @returns {undefined}
 * @export
 */
export async function start() {
  log.info('%s Master Bootstrapping', APPLICATION_NAME);
  log.debug('Initialized with configuration', config);

  const firstrun = FIRST_RUN && NODE_ENV !== 'production';

  // Pre-sync setup
  if (firstrun) await setup.presync();

  // Kick of database syncing and model creation
  await initializeDatabase();
  log.debug('Registered models:', Object.keys(models));

  // Post-sync setup
  if (firstrun) await setup.postsync(models);

  // Fork all worker processes
  await bootstrapCluster();
}

cluster.on('exit', onWorkerExit);
export default { start };
