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
  permission: 'LOGIN',
  // A string used to match routes (i.e app[method]([match]))
  match: '/login',
  // The app[method] callback handler
  handler: (req, res) => {
    if (req.isAuthenticated()) {
      return res.status(200).json(new JSONResponse({ success: true, message: 'already logged in', user: req.user }));
    }

    return passport.authenticate('local')(req, res, (e) => {
      if (e) return res.status(401).json(new JSONResponse(e));
      return res.status(200).json(new JSONResponse({ success: true, message: 'log in successful', user: req.user }));
    });
  },
};
