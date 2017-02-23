/**
 * The application main entry point.
 * Starts the master process.
 * @file
 */

import path from 'path';
import cluster from 'cluster';
import config from './config';
import log from './lib/logger';
import { init as initializeDatabase } from './lib/sequelize';

process.title = config.PROCESS_TITLES.MASTER;

const {
  WORKER_COUNT,
  WORKER_RESTART_DELAY,
  WORKER_RESTARTS_RESET_AFTER,
  WORKER_RESTARTS_MAX,
} = config.CLUSTER;

cluster.setupMaster({
  exec: path.join(__dirname, 'worker'),
  stdio: 'inherit',
});

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
function onWorkerExit(worker) {
  // Process hasn't been alive long enough, just let the error be thrown.
  if (uptime() <= WORKER_RESTART_DELAY) return;

  // Get the worker number and setup the restart reference object.
  const num = getWorkerNumber(worker);
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
  if (WORKER_RESTARTS_MAX > 0 && ref.forks >= WORKER_RESTARTS_MAX) return;
  log.warn('Worker number %s died, forking replacement (%s total forks)', num, ref.forks);
  cluster.fork();
}

cluster.on('exit', onWorkerExit);

/**
 * Forks all worker processes
 * @returns {undefined}
 */
function forkWorkers() {
  log.debug('Master is forking %s workers', WORKER_COUNT);
  for (let i = 0; i < WORKER_COUNT; i++) cluster.fork();
}

/**
 * Starts the cluster.
 * @returns {undefined}
 * @export
 */
export async function start() {
  log.debug('Initialized with configuration', config);
  await initializeDatabase();
  forkWorkers();
}

export default { start };
