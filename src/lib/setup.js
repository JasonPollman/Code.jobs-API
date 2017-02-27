/**
 * A "setup" script that is run if config.FIRST_RUN is set to true.
 * This should (and will) only run in non-production environments.
 * @file
 */

import _ from 'lodash';
import uuid from 'uuid/v4';
import models from '../database/models';
import log from './logger';
import config from '../config';
import roles from '../config/roles';
import permissions, { descriptions } from '../config/permissions';

const { Application, Role, Permission, RolePermission } = models;

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
   * @returns {Promise} Resolves when all database post-sync tasks are complete.
   */
  async postsync() {
    if (config.NODE_ENV === 'production') return [];
    log.info('First run post-sync task running...');

    // Create the front-end application uuid
    log.debug('Setup: Creating Application "%s"', 'Code Jobs Frontend');
    await Application.create({
      enabled: true,
      uuid: uuid(),
      name: 'Code Jobs Frontend',
    });

    // Create all the permission records
    const permissionRecords = await Promise.props(_.mapValues(permissions, (name, key) => {
      log.debug('Setup: Creating permission "%s"', name, descriptions[key]);
      return Permission.create({ name, description: descriptions[key] });
    }));

    // Create all the role records
    const roleRecords = await Promise.props(_.mapValues(roles, (role) => {
      log.debug('Setup: Creating role "%s"', role.name);
      return Role.create({ name: role.name, description: role.description });
    }));

    // Create all the role/permission associations
    return Promise.all(_.map(roleRecords, async (inserted, name) => {
      const roleId = inserted.dataValues.id;
      const role = roles[name];

      return Promise.all(role.permissions.map((permissionName) => {
        const permission = _.findKey(permissions, v => v === permissionName);
        const permissionInsert = permissionRecords[permission];
        const permissionId = permissionInsert.dataValues.id;

        log.debug('Setup: Creating role/permission association: "%s" => "%s"', role.name, permission);
        return RolePermission.create({ roleId, permissionId });
      }));
    }));
  },
};
