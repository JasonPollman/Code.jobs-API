/**
 * Defines the RolePermission model.
 * @file
 */

import { INTEGER } from 'sequelize';
import sequelize from '../';

export default sequelize.define('rolePermission',
  {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  },
);
