/**
 * Defines the User model.
 * @file
 */

import _ from 'lodash';
import { INTEGER, STRING } from 'sequelize';
import { hashUserPassword } from '../../lib/utils';
import sequelize from '../';
import config from '../../config';
import { Role } from './Role';

const {
  PASSWORD_HASH_ALGORITHM,
  PASSWORD_VALIDATION,
} = config.USER_ACCOUNTS;

const {
  MIN_LENGTH,
  MAX_LENGTH,
  MUST_CONTAIN_LOWERCASE_CHARACTERS,
  MUST_CONTAIN_UPPERCASE_CHARACTERS,
  MUST_CONTAIN_NUMERIC_CHARACTERS,
  MUST_CONTAIN_NON_ALPHANUMERIC_CHARACTERS,
} = PASSWORD_VALIDATION;

/**
 * Hashes a user's password.
 * @param {object} user The user insert/update object.
 * @returns {undefined}
 */
function hashPassword(user) {
  if (user.password) {
    const usr = user;
    usr.password = hashUserPassword(usr.password, usr.email, PASSWORD_HASH_ALGORITHM);
  }
}

/**
 * Validates a users's password.
 * @param {string} password The password to validate.
 * @returns
 */
function isValidPassword(password) {
  return password && password.length >= MIN_LENGTH && password.length <= MAX_LENGTH
    && (!MUST_CONTAIN_LOWERCASE_CHARACTERS ? true : /[a-z]/g.test(password))
    && (!MUST_CONTAIN_UPPERCASE_CHARACTERS ? true : /[A-Z]/g.test(password))
    && (!MUST_CONTAIN_NUMERIC_CHARACTERS ? true : /[0-9]/g.test(password))
    && (!MUST_CONTAIN_NON_ALPHANUMERIC_CHARACTERS ? true : /[^a-z0-9]/g.test(password));
}

const invalidPasswordMessage = (
  `Invalid password. Passwords must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters and meet the following conditions: ` +
  `${MUST_CONTAIN_LOWERCASE_CHARACTERS ? `contains at least ${MUST_CONTAIN_LOWERCASE_CHARACTERS} lowercase character(s), ` : ''}` +
  `${MUST_CONTAIN_UPPERCASE_CHARACTERS ? `contains at least ${MUST_CONTAIN_UPPERCASE_CHARACTERS} uppercase character(s), ` : ''}` +
  `${MUST_CONTAIN_NUMERIC_CHARACTERS ? `contains at least ${MUST_CONTAIN_NUMERIC_CHARACTERS} numeric character(s), ` : ''}` +
  `${MUST_CONTAIN_NON_ALPHANUMERIC_CHARACTERS ? `contains at least ${MUST_CONTAIN_NON_ALPHANUMERIC_CHARACTERS} special character(s), ` : ''}`)
  .replace(/, $/, '');

export default sequelize.define('user',
  {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    firstName: {
      type: STRING(64),
      allowNull: true,
      validate: {
        len: {
          args: [2, 64],
          msg: 'Value for field "firstName" must be at least 2 characters',
        },
      },
    },
    lastName: {
      type: STRING(64),
      allowNull: true,
      validate: {
        len: {
          args: [2, 64],
          msg: 'Value for field "lastName" must be at least 2 characters',
        },
      },
    },
    password: {
      type: STRING(64),
      allowNull: false,
      validate: {
        isValidPassword: (password) => {
          if (!isValidPassword(password)) throw new Error(invalidPasswordMessage);
        },
      },
    },
    email: {
      type: STRING(255),
      allowNull: false,
      unique: {
        args: true,
        msg: 'An account with the provided email address already exists',
      },
      validate: {
        isEmail: {
          args: true,
          msg: 'Invalid email address',
        },
      },
    },
    roleId: {
      type: INTEGER,
      defaultValue: 1,
      allowNull: false,
      references: {
        model: Role,
        key: 'id',
      },
    },
  },
  {
    instanceMethods: {
      pretty() {
        const values = this.get({ plain: true });
        const role = values.role || { name: null, permissions: [] };

        values.role = role.name;
        values.permissions = role.permissions.map(permission => permission.name);
        console.log(_.omit(values, 'password', 'roleId'));
        return _.omit(values, 'password', 'roleId');
      },
    },
    hooks: {
      beforeCreate: hashPassword,
      beforeUpdate: hashPassword,
    },
  },
);
