/**
 * Setups up the database connection (using sequelize)
 * @file
 */

import Sequelize from 'sequelize';
import { format } from 'sqlformatter';
import config from '../config';
import log from '../lib/logger';

const { HOST, PORT, USER, PASS, SCHEMA, POOL_CONFIG } = config.DATABASE;

/**
 * A sequelize connection.
 * @type {Sequelize}
 */
const sequelize = new Sequelize(SCHEMA, USER, PASS, {
  dialect: 'mysql',
  host: HOST,
  port: PORT,
  pool: POOL_CONFIG,

  logging: config.NODE_ENV !== 'production' ? sql => log.debug(format(sql)) : false,
});

export default sequelize;
