/**
 * Entry point for Code.jobs API CLI
 * @file
 */

import yargs from 'yargs';
import * as api from '../';

// Set the process title
process.title = 'Code.jobs API Server';

const options = yargs
  .options({
    workers: {
      alias: 'w',
      describe: 'The number of worker processes to spawn',
    },
  })
  .help()
  .argv;

// Start the server.
(async () => api.start(options))().catch(e => process.nextTick(() => { throw e; }));
