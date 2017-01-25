/**
 * A "catch all" route that sends back 401 - Unauthorized.
 * @export
 */

import JSONResponse from '../lib/json-response';

export default {
  // The method this route applies to.
  method: 'get',
  // Moves this route up/down based on "z-index"
  specificity: 0,
  // The permission the user needs to acces this route
  // If falsy the 'none' permission will be applied automatically.
  permission: 'none',
  // A string used to match routes (i.e app[method]([match]))
  match: '/unauthorized',
  // The app[method] callback handler
  handler: (req, res) => {
    res.status(401).json(new JSONResponse({ message: 'Unauthorized' }));
  },
};
