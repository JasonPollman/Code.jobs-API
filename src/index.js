import Cluster from './lib/cluster';

/**
 * Starts the cluster workers.
 * @returns {Cluster} The cluster.
 */
export async function start(options = {}) {
  const cluster = new Cluster(options);
  return await cluster.init();
}

export default {};
