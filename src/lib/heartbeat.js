/**
 * Publishes a worker heartbeat
 * @file
 */

import cluster from 'cluster';
import _ from 'lodash';
import redis from './redis';
import config from '../config';
import { requestStatistics } from '../middlewares/request-stats';
import { uptime, workerCount } from './utils';

const {
  WORKER_NUM,
  IS_WORKER,
  SERVER,
} = config;

const {
  ENABLED,
  INTERVAL,
} = config.HEARTBEAT;

/**
 * @returns {Promise} Resolves with each worker process' heartbeat status.
 * @export
 */
export function heartbeatWorkerStatuses() {
  return Promise.all(_.times(config.CLUSTER.WORKER_COUNT, n =>
    redis.getAsync(redis.key(config.REDIS_PREFIXES.HEARTBEAT, 'WORKER', n + 1))));
}

/**
 * @returns {Promise} Resolves with the master process' heartbeat status.
 * @export
 */
export function heartbeatMasterStatus() {
  return redis.getAsync(redis.key(config.REDIS_PREFIXES.HEARTBEAT, 'MASTER'));
}

/**
 * Sends off and sets the worker's pulse status in redis.
 * This is the callback for each heart "beat" for workers.
 * @returns {undefined}
 * @export
 */
export function workerPulse() {
  const status = {
    id: cluster.worker.id,
    pid: process.id,
    number: WORKER_NUM,
    uptime: uptime(),
    memory: process.memoryUsage(),
    statistics: !SERVER.DISABLED_MIDDLEWARES.requestStats ? requestStatistics : undefined,
  };

  const key = redis.key(config.REDIS_PREFIXES.HEARTBEAT, 'WORKER', WORKER_NUM);
  redis.setAsync(key, status);
  redis.publish(key, status);
}

/**
 * Sends off and sets the master's pulse status in redis.
 * This is the callback for each heart "beat" for the master.
 * @returns {undefined}
 * @export
 */
export function masterPulse() {
  const status = {
    pid: process.id,
    uptime: uptime(),
    workers: workerCount(),
    memory: process.memoryUsage(),
  };

  const key = redis.key(config.REDIS_PREFIXES.HEARTBEAT, 'MASTER');
  redis.setAsync(key, status);
  redis.publish(key, status);
}

/**
 * Initializes the master/worker heartbeat.
 * @returns {undefined}
 * @export
 */
export default function initialize() {
  if (!ENABLED) return;

  if (IS_WORKER) {
    workerPulse();
    setInterval(workerPulse, INTERVAL);
  } else {
    masterPulse();
    setInterval(masterPulse, INTERVAL);
  }
}
