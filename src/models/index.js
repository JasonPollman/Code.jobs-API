/**
 * Exports all the various data models
 * @file
 */

import user from './user';

export default {
  user,
};

export async function getModel(key) {
  return exports.default[key] ? exports.default[key].model : undefined;
}

