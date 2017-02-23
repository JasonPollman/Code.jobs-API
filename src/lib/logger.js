/**
 * Sets up the bunyan logger.
 * @file
 */

import cluster from 'cluster';
import { createLogger } from 'bunyan';
import config from '../config';

/**
 * True if the current process is a worker, false if it's the master.
 * @type {boolean}
 */
const isWorker = cluster.isWorker;

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  name: isWorker ? `Worker ${config.WORKER_NUM}` : 'Master',
});

export default logger;
