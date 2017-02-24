/**
 * A "setup" script that is run if config.FIRST_RUN is set to true.
 * This should (and will) only run in non-production environments.
 * @file
 */

import uuid from 'uuid/v4';
import models from '../database/models';
import log from './logger';
import config from '../config';

const { Application } = models;

export default {
  /**
   * Run before sequelize has sync'd the database tables.
   * Use this function to run setup scripts to create DB users, custom SQL scripts, etc.
   * @returns {undefined}
   */
  async presync() {
    if (config.NODE_ENV === 'production') return;
    log.info('First run pre-sync task running...');
  },

  /**
   * Run after sequelize has sync'd the database tables.
   * Use this function to add records (and/or associations)
   * @returns {undefined}
   */
  async postsync() {
    if (config.NODE_ENV === 'production') return;
    log.info('First run post-sync task running...');

    // Create the front-end Application
    await Application.create({
      enabled: true,
      uuid: uuid(),
      name: 'Code Jobs Frontend',
    });
  },
};
