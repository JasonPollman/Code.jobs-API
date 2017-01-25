/**
 * A "catch all" route that sends back 401 - Unauthorized.
 * @export
 */
export default {
  // The method this route applies to
  method: 'GET',
  // Moves this route up/down based on "z-index"
  specificity: 0,
  // The permission the user needs to acces this route
  permission: 'none',
  // A string used to match routes, i.e app.get([match])
  match: '*',
  // The app[method] callback handler
  handler: (req, res, next) => {
    res.status(401).json({ message: 'Unauthorized', success: false });
    next();
  },
};
