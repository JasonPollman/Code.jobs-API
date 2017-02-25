/**
 * Entry point for API CLI
 * @file
 */

import * as api from '../';
import log from '../lib/logger';

const onException = e => log.fatal(e) || setTimeout(() => process.exit(1), 1000);
process.on('uncaughtException', onException);

// Start the server.
api.start().catch(onException);
