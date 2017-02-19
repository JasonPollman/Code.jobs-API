/**
 * Exports and validates the selected data driver.
 * @file
 */

import _ from 'lodash';
import path from 'path';
import DBAbstractor from '@jasonpollman/db-abstractor';
import * as helpers from './lib/helpers';
import * as fields from './lib/fields';
import driver from './drivers/mysql';

export default new DBAbstractor({
  // The directories to scan for SQL queries
  dirs: [path.join(__dirname, 'sql', 'mysql')],
  // Uses the current driver to execute commands
  executor: (sql, input) => driver.execute(sql, input),
});

/**
 * Connects the current database driver.
 * @function
 */
const connect = (...args) => driver.connect(...args);

/**
 * Disconnects the current database driver.
 * @function
 */
const disconnect = (...args) => driver.disconnect(...args);

// Add the connect, disconnect and all helper methods to the db abstractor.
const boundHelpers = _.mapValues(helpers, helper => helper.bind(exports.default));
Object.assign(exports.default, { connect, disconnect, ...boundHelpers, ...fields });
