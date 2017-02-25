/**
 * Defines the Role model.
 * @file
 */

import { INTEGER, STRING, BOOLEAN } from 'sequelize';
import sequelize from '../';

export default sequelize.define('role',
  {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: STRING(64),
      allowNull: false,
      unique: {
        args: true,
        msg: 'A role with the provided name already exists',
      },
    },
    description: {
      type: STRING(256),
      allowNull: false,
    },
    enabled: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: false,
  },
);
