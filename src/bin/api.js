/**
 * Entry point for Code.jobs API CLI
 * @file
 */

import * as api from '../';

// Set the process title
process.title = 'Code.jobs API Server';

// Ensure we have a NODE_ENV
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Start the server.
api.start().catch(e => process.nextTick(() => { throw e; }));
