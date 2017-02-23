import { INTEGER, STRING } from 'sequelize';

export default {
  name: 'user',
  routes: [
  ],
  schema: {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    email: {
      type: STRING(255),
      allowNull: false,
    },
  },
};
