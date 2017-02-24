/**
 * Defines the User model.
 * @file
 */

import { INTEGER, STRING } from 'sequelize';
import sequelize from '../';

export default sequelize.define('user', {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  firstName: {
    type: STRING(64),
    allowNull: true,
  },
  lastName: {
    type: STRING(64),
    allowNull: true,
  },
  email: {
    type: STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
});
