/**
 * Defines the /user route.
 * @file
 */

import JSONResponse from '../lib/json-response';
import data from '../data';
import '../lib/passport-setup';

/**
 * Authenticates a user.
 * @export
 */
export default [
  {
    // Gets a user by username
    method: 'get',
    specificity: 0,
    permission: 'VIEW_OTHER_USERS_INFO',
    match: '/user/username/:username',
    handler: async (req, res) => {
      const username = req.params.username;
      const user = await data.exec('getUserByUsername', { username });
      return res.status(200).json(new JSONResponse({ success: true, user }));
    },
  },
  {
    // Gets a user by id
    method: 'get',
    specificity: 0,
    permission: 'VIEW_OTHER_USERS_INFO',
    match: '/user/id/:id',
    handler: async (req, res) => {
      const id = req.params.id;
      const user = await data.exec('getUserById', { id });
      return res.status(200).json(new JSONResponse({ success: true, user }));
    },
  },
  {
    // Gets all users
    method: 'get',
    specificity: 0,
    permission: 'VIEW_OTHER_USERS_INFO',
    match: '/users',
    handler: async (req, res) => {
      const users = await data.exec('getAllUsers');
      return res.status(200).json(new JSONResponse({ success: true, users }));
    },
  },
  {
    // Gets a list of users by name
    method: 'get',
    specificity: 0,
    permission: 'VIEW_OTHER_USERS_INFO',
    match: '/users/name/:name',
    handler: async (req, res) => {
      const name = req.params.name;
      const users = await data.exec('getUsersByName', { name });
      return res.status(200).json(new JSONResponse({ success: true, users }));
    },
  },
  {
    // Gets a user's own information
    method: 'get',
    specificity: 0,
    permission: 'VIEW_OWN_INFO',
    match: '/user',
    handler: async (req, res) => {
      const user = await data.exec('getUserByUsername', { username: req.user.username });
      return res.status(200).json(new JSONResponse({ success: true, user }));
    },
  },
  {
    // Updates a user's own information
    method: 'post',
    specificity: 0,
    permission: 'UPDATE_OWN_INFO',
    match: '/user',
    handler: async (req, res) => {
      const { user, results } = await data.exec('updateUserByUsername', { ...req.body, username: req.user.username });
      return res.status(200).json(new JSONResponse({ success: !!results.ok, message: 'User updated', user }));
    },
  },
];
