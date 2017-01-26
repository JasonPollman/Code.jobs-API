import _ from 'lodash';
import { ObjectId } from 'mongodb';
import redis from '../../../../lib/redis';
import { hashUserPassword } from '../../../../lib/utils';

/**
 * Convenience function for getting a redis user cache item.
 * @param {string} id The key to retrieve the cache using.
 */
export async function getCache(id) {
  if (!id) return undefined;
  return await redis.get(redis.key('users', id));
}

/**
 * Convenience function for forgettin a redis user cache item.
 * @param {string} id The key to retrieve the cache using.
 */
export async function forgetCache(user) {
  if (!_.isObject(user)) return user;

  return await Promise.all([
    redis.forget(redis.key('users', user._id)), // eslint-disable-line no-underscore-dangle
    redis.forget(redis.key('users', user.username)),
  ]);
}

/**
 * Convenience function for setting a redia user cache item.
 * @param {object} user A user object.
 * @returns {object} The originally passed in user object.
 */
export async function setCache(user) {
  if (!_.isObject(user)) return user;

  await Promise.all([
    redis.set(redis.key('users', user._id), user), // eslint-disable-line no-underscore-dangle
    redis.set(redis.key('users', user.username), user),
  ]);
  return user;
}

/**
 * Looks up a user by id.
 * @param {MongoClient} mongo The mongodb connection.
 * @param {object} data Data to lookup the user with.
 * @returns {object} The user, or undefined if not found.
 */
export async function getUserById(mongo, data) {
  const { id } = data;

  // Lookup cache item and return it if it exists.
  const cache = await getCache(id);
  if (cache) return cache;

  const users = mongo.collection('users');
  const user = await new Promise((resolve, reject) =>
    users.findOne({ _id: new ObjectId(id) }, (err, doc) => (err ? reject(err) : resolve(doc))));

  return await setCache(user);
}

/**
 * Looks up a user by username.
 * @param {MongoClient} mongo The mongodb connection.
 * @param {object} data Data to lookup the user with.
 * @returns {object} The user, or undefined if not found.
 */
export async function getUserByUsername(mongo, data) {
  const { username } = data;

  // Lookup cache item and return it if it exists.
  const cache = await getCache(username);
  if (cache) return cache;

  const users = mongo.collection('users');
  const user = await new Promise((resolve, reject) =>
    users.findOne({ username }, (err, doc) => (err ? reject(err) : resolve(doc))));

  return await setCache(user);
}

/**
 * Looks up users by their name.
 * @param {MongoClient} mongo The mongodb connection.
 * @param {object} data Data to lookup the user with.
 * @returns {object} The user, or undefined if not found.
 */
export async function getUsersByName(mongo, data) {
  const users = mongo.collection('users');
  const { name } = data;

  return await new Promise((resolve, reject) =>
    users.find({ name }).toArray((err, doc) => (err ? reject(err) : resolve(doc))));
}

/**
 * Looks up users by their name.
 * @param {MongoClient} mongo The mongodb connection.
 * @returns {object} A list of all users.
 */
export async function getAllUsers(mongo) {
  const users = mongo.collection('users');

  return await new Promise((resolve, reject) =>
    users.find().toArray((err, doc) => (err ? reject(err) : resolve(doc))));
}

/**
 * Updates a user's information.
 * @param {MongoClient} mongo The mongodb connection.
 * @param {object} data Data to update the user with.
 * @returns {object} A list of all users.
 */
export async function updateUserByUsername(mongo, data) {
  const users = mongo.collection('users');
  const { username } = data;

  // Users cannot change their username or group
  const updated = { ...data };

  // Setting to undefined doesn't work in mongo, it will null out the data
  delete updated.username;
  delete updated.group;

  if (_.isString(updated.password)) updated.password = hashUserPassword(updated.password);

  const results = await new Promise((resolve, reject) =>
    users.updateOne(
      { username },
      { $set: updated },
      (err, doc) => (err ? reject(err) : resolve(doc))));

  // User was updated, purge cache
  let user = await getUserByUsername(mongo, data);
  await forgetCache(user);
  user = await getUserByUsername(mongo, data);

  return { results: results.result, user };
}
