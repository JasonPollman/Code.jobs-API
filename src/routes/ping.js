/**
 * Defines the /ping route.
 * A health check route.
 * @file
 */

import _ from 'lodash';
import os from 'os';
import { heartbeatMasterStatus, heartbeatWorkerStatuses } from '../lib/heartbeat';
import config from '../config';

const {
  HEARTBEAT,
} = config;

/**
 * Sent back with the ping response.
 * We have to clone the config, as the .respond() method will strip out passwords
 * and the config object is immutable.
 * @type {object}
 */
const clonedConfig = _.cloneDeep(config);

/**
 * A ping/health check route.
 * @export
 */
export default {
  // The method this route applies to.
  method: 'get',
  // A string used to match routes (i.e app[method]([match]))
  match: ['/ping', '/ping/:timeout'],
  // The app[method] callback handler
  handler: async function ping(request, response) {
    const timeout = parseInt(request.params.timeout, 10) || 0;
    const server = this.server;

    let masterStatus;
    let workerStatuses;

    if (HEARTBEAT.ENABLED) {
      [masterStatus, workerStatuses] = await Promise.all([
        heartbeatMasterStatus(),
        heartbeatWorkerStatuses(),
      ]);
    }

    const payload = {
      os: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        uptime: os.uptime() * 1000,
        cpus: os.cpus().length,
      },
      server: {
        listening: server.listening,
        timeout: server.timeout,
        address: server.address(),
      },
      master: masterStatus,
      workers: workerStatuses,
      config: clonedConfig,
    };

    setTimeout(() => {
      response.status(200).respond({
        success: true,
        message: 'pong',
        payload,
      });
    }, timeout);
  },
};
