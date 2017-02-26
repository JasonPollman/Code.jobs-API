/**
 * Defines the Request model.
 * @file
 */

import { INTEGER, STRING, TEXT, DATE, ENUM } from 'sequelize';
import User from './User';
import sequelize from '../';

export default sequelize.define('request',
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
    requested: {
      type: DATE,
      allowNull: false,
    },
    ip: {
      type: STRING(45),
      allowNull: false,
      validate: {
        isIP: true,
      },
    },
    user: {
      type: INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    method: {
      type: ENUM('HEAD', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'CONNECT'),
      allowNull: false,
    },
    path: {
      type: STRING(1024),
      allowNull: false,
    },
    url: {
      type: STRING(2083),
      allowNull: false,
    },
    referer: {
      type: STRING(128),
      allowNull: true,
    },
    userAgent: {
      type: STRING(512),
      allowNull: true,
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
