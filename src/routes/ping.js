/**
 * Defines the /ping route.
 * A health check route.
 * @file
 */

import os from 'os';
import { heartbeatMasterStatus, heartbeatWorkerStatuses } from '../lib/heartbeat';
import config from '../config';

const {
  HEARTBEAT,
} = config;

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
      master: HEARTBEAT.ENABLED ? await heartbeatMasterStatus() : undefined,
      workers: HEARTBEAT.ENABLED ? await heartbeatWorkerStatuses() : undefined,
      config,
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
