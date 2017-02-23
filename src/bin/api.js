/**
 * Entry point for Code Jobs API CLI
 * @file
 */

import * as api from '../';

// Start the server.
api.start().catch(e => process.nextTick(() => { throw e; }));
