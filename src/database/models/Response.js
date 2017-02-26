/**
 * Defines the Request model.
 * @file
 */

import { INTEGER, STRING, DATE, TEXT } from 'sequelize';
import sequelize from '../';

export default sequelize.define('response',
  {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    uuid: {
      type: STRING(36),
      allowNull: false,
      unique: true,
      validate: {
        isUUID: 4,
      },
    },
    sent: {
      type: DATE,
      allowNull: false,
    },
    status: {
      type: INTEGER,
      allowNull: false,
    },
    responseTime: {
      type: INTEGER,
      allowNull: false,
    },
    headers: {
      type: TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  },
);
