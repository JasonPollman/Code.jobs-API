import cluster from 'cluster';
import debuggr from 'debug';
import Server from './server';
import data from '../data';
import redis from './redis';
import constants from './constants';

const debug = debuggr('api-cluster');

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
    debug(cluster.isMaster ? 'Master is running, pid %s' : 'Worker is running, pid %s', process.pid);
    if (cluster.isWorker) return;

    // Fork workers, and setup worker events
    for (let i = 0; i < constants.WORKER_COUNT; i++) this.fork();

    // Fork a new worker if one dies
    cluster.on('exit', (worker, code, signal) => {
      debug('Worker %s died, (code: %s, signal: %s), forking replacement', worker.id, code, signal);
      cluster.fork();
    });
  }

  /**
   * Forks a new worker.
   */
  async fork() {
    debug('Forking new worker, count is now %s', Object.keys(cluster.workers).length + 1);
    cluster.fork();
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
    debug('Connection to database...');
    debug('Connecting to redis client...');

    await Promise.all([
      data.connect(),
      redis.connect(),
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

