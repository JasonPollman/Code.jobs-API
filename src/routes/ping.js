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
  permission: 'NONE',
  // A string used to match routes (i.e app[method]([match]))
  match: ['/ping', '/ping/:timeout'],
  // The app[method] callback handler
  handler: (req, res) => {
    const timeout = parseInt(req.params.timeout, 10) || 0;

    setTimeout(() => {
      res.status(200).json(new JSONResponse({ success: true, message: 'pong', timeout, worker: process.pid }));
    }, timeout);
  },
};
