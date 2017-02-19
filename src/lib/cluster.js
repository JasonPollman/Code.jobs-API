import { EOL as eol, hostname } from 'os';
import cluster from 'cluster';
import debuggr from 'debug';
import Server from './server';
import data from '../data';
import redis from './redis';
import constants from './constants';

const debug = debuggr(`api:cluster:${cluster.isMaster ? 'master' : 'worker'}:${process.pid}`);

/**
 * Controlls both the master and slave cluster workers.
 * @class Cluster
 * @export
 */
export default class Cluster {
  /**
   * Creates an instance of Cluster.
   * @param {object} [opts={}] Options for this Cluster instance.
   * @memberof Cluster
   */
  constructor() {
    debug(cluster.isMaster ? 'Master is (PID %O) online' : 'Worker (PID %O) online', process.pid);
    if (cluster.isWorker) return;

    debug('NODE_ENV is %O', constants.NODE_ENV);
    debug('Server hostname is %O', hostname());
    this.forks = {};

    // Fork workers, and setup worker events
    for (let i = 0; i < constants.WORKER_COUNT; i++) this.fork(i);

    // Fork a new worker if one dies
    cluster.on('exit', (worker, code, signal) => {
      const mid = worker.id % constants.WORKER_COUNT;

      if (this.forks[mid] > 2) {
        throw new Error(
          `Worker #${mid} has died more than the allowed MAX_WORKER_RETRYS limit ` +
          `(currently ${constants.MAX_WORKER_RETRYS}). ` +
          `${eol}Exiting due to worker failure (code: ${code}, signal: ${signal}).`,
        );
      }

      debug('Worker #%s died, (code: %s, signal: %s), forking replacement...', mid, code, signal);
      return this.fork(worker.id);
    });
  }

  /**
   * Forks a new worker.
   * @param {object<string>} Key/value environment variable pairs
   */
  async fork(id) {
    cluster.fork();
    const mid = id % constants.WORKER_COUNT;
    this.forks[mid] = (this.forks[mid] || 0) + 1;
  }

  /**
   * Shuts down the worker with the given id.
   * @param {number|string} id The id of the worker to shutdown.
   * @returns {cluster.Worker} The worker that was shutdown.
   */
  async disconnectWorker(id) {
    const worker = cluster.workers[id];
    if (!worker) return null;

    debug('Disconnecting worker %s', worker.id);
    worker.disconnect();
    return worker;
  }

  /**
   * Disconnects the cluster (disconnecting all workers)
   * @returns {undefined}
   */
  async disconnect() {
    if (cluster.isWorker) return;
    debug('Cluster disconnecting...');
    await new Promise(resolve => cluster.disconnect(() => resolve));
  }

  /**
   * Initializes each worker and starts a new server.
   * @returns {Cluster} The current cluster instance.
   */
  async init() {
    // Master has nothing to do here, return
    if (cluster.isMaster) return this;
    process.title += ' Worker';

    // Setup a database and redis connection
    await Promise.all([
      redis.connect(),
      data.connect(),
    ]);

    // Setup the server for each worker
    this.server = new Server({
      https: constants.SERVER.HTTPS,
      httpsOptions: constants.SERVER.HTTPS_OPTIONS,
      port: constants.SERVER.PORT,
    });

    await this.server.start();
    return this;
  }
}

