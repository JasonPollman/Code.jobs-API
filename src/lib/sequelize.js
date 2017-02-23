import _ from 'lodash';
import Sequelize from 'sequelize';
import config from '../config';
import log from './logger';
import defs from '../models';

const { SYNC, HOST, PORT, USER, PASS, SCHEMA, POOL_CONFIG } = config.DATABASE;
const { IS_WORKER } = config;

/**
 * A sequelize connection.
 * @type {Sequelize}
 */
let sequelize = null;

/**
 * Syncs database tables.
 * @param {boolean=} [force=false] If true, tables will be dropped and recreated.
 * @returns {Promise} Resolves when database syncing is complete.
 * @export
 */
export function sync(force = false) {
  log.debug('Syncing database tables (enabled by config, force=%s)', force);
  return sequelize.sync({ force });
}

/**
 * Syncs the database tables if config.DATABASE.SYNC is truthy.
 * @returns {Promise<Sequelize>} Resolves with the Sequelize connection instance.
 * @export
 */
export async function init() {
  if (sequelize) return sequelize;

  sequelize = new Sequelize(SCHEMA, USER, PASS, {
    dialect: 'mysql',
    host: HOST,
    port: PORT,
    pool: POOL_CONFIG,
  });

  // Initialize all models
  _.each(defs, (definition) => {
    const { name, options } = definition;
    log.debug('Initializing sequelize model "%s"', name);
    defs[name] = Object.assign(sequelize.define(name, options), { definition });
  });

  // Sync database tables (make sure this is only done by master process!)
  if (SYNC && IS_WORKER === false) await sync(SYNC === 'force');

  log.debug('Sequelize initialized');
  return sequelize;
}

export default {
  get sequelize() {
    return init();
  },
};
