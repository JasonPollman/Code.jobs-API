/**
 * Defines the Permission model.
 * @file
 */

import { INTEGER, STRING, BOOLEAN } from 'sequelize';
import sequelize from '../';

export default sequelize.define('permission', {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: STRING(64),
    allowNull: false,
  },
  description: {
    type: STRING(256),
    allowNull: false,
  },
  enabled: {
    type: BOOLEAN,
    allowNull: false,
    default: true,
  },
});
