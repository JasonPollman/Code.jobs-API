/**
 * Setups up the database connection (using sequelize)
 * @file
 */

import Sequelize from 'sequelize';
import config from '../config';

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
});

export default sequelize;
