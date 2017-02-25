/**
 * Defines the Application model.
 * @file
 */

import { INTEGER, STRING, BOOLEAN } from 'sequelize';
import sequelize from '../';

export default sequelize.define('application', {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: STRING(64),
    allowNull: false,
    unique: true,
  },
  uuid: {
    type: STRING(36),
    allowNull: false,
    unique: true,
    validate: {
      isUUID: 4,
    },
  },
  enabled: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});
