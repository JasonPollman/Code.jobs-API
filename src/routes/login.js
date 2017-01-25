/**
 * A "catch all" route that sends back 401 - Unauthorized.
 * @export
 */
export default {
  // The method this route applies to
  method: 'POST',
  // Moves this route up/down based on "z-index"
  specificity: 0,
  // The permission the user needs to acces this route
  // If falsy no permission is required.
  permission: null,
  // A string used to match routes, i.e app.get([match])
  match: '/login',
  // The app[method] callback handler
  handler: (req, res, next) => {
    res.status(200).json({ message: 'Logged in', success: true });
    next();
  },
};
