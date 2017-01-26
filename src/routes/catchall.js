/**
 * A "catch all" route that sends back 401 - Unauthorized.
 * @export
 */

export default {
  // The method this route applies to.
  method: 'all',
  // Moves this route up/down based on "z-index"
  specificity: Number.MAX_VALUE,
  // The permission the user needs to acces this route
  // If falsy the 'none' permission will be applied automatically.
  permission: 'NONE',
  // A string used to match routes (i.e app[method]([match]))
  match: '*',
  // The app[method] callback handler
  handler: (req, res) => {
    res.redirect('/unauthorized');
  },
};
