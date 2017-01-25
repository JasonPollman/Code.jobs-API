/**
 * Defines the /login route.
 * @file
 */

import passport from 'passport';
import JSONResponse from '../lib/json-response';
import '../lib/passport-setup';

/**
 * Authenticates a user.
 * @export
 */
export default {
  // The method this route applies to.
  method: 'post',
  // Moves this route up/down based on "z-index"
  specificity: 0,
  // The permission the user needs to acces this route
  // If falsy the 'none' permission will be applied automatically.
  permission: 'login',
  // A string used to match routes (i.e app[method]([match]))
  match: '/login',
  // The app[method] callback handler
  handler: (req, res) => {
    passport.authenticate('local')(req, res, () => {
      res.status(200).json(new JSONResponse({
        success: true,
        user: req.user,
      }));
    });
  },
};
