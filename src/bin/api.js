/**
 * Entry point for Code.jobs API CLI
 * @file
 */

import * as api from '../';

// Set the process title
process.title = 'Code.jobs API Server';

// Start the server.
(async () => api.start())().catch(e => process.nextTick(() => { throw e; }));
