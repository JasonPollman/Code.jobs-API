/**
 * Defines the /ping route.
 * @file
 */

import os from 'os';
import '../lib/passport-setup';

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
  handler: (request, response) => {
    console.log('I AM HERE');
    const timeout = parseInt(request.params.timeout, 10) || 0;
    const payload = {
      process: {
        pid: process.pid,
        uid: process.getuid(),
        env: process.env.NODE_ENV,
        version: process.version,
        uptime: process.uptime(),
        argv: process.argv,
        cpu: process.cpuUsage(),
      },
      os: {
        uptime: os.uptime(),
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname(),
        cpus: os.cpus(),
      },
    };

    setTimeout(() => {
      response.status(200).respond({
        success: true,
        message: 'pong',
        worker: process.pid,
        timeout,
        payload,
      });
    }, timeout);
  },
};
