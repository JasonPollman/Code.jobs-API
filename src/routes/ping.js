/**
 * Defines the /login route.
 * @file
 */

import JSONResponse from '../lib/json-response';
import '../lib/passport-setup';

/**
 * Authenticates a user.
 * @export
 */
export default {
  // The method this route applies to.
  method: 'get',
  // Moves this route up/down based on "z-index"
  specificity: 0,
  // The permission the user needs to acces this route
  // If falsy the 'none' permission will be applied automatically.
  permission: 'none',
  // A string used to match routes (i.e app[method]([match]))
  match: '/ping',
  // The app[method] callback handler
  handler: (req, res) => {
    res.status(200).json(new JSONResponse({ success: true, message: 'pong' }));
  },
};
