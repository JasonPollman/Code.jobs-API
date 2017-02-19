/**
 * A "catch all" route that sends back 401 - Unauthorized.
 * @export
 */

import unauthorized from './unauthorized';

export default {
  // The method this route applies to.
  method: 'all',
  // Moves this route up/down based on "z-index"
  specificity: Number.MAX_VALUE,
  // A string used to match routes (i.e app[method]([match]))
  match: '*',
  // The app[method] callback handler
  handler: unauthorized.handler,
};
