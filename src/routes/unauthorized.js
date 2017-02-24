/**
 * A "catch all" route that sends back 401 - Unauthorized.
 * @export
 */
export default {
  // The method this route applies to.
  method: 'get',
  // A string used to match routes (i.e app[method]([match]))
  match: '/unauthorized',
  // The app[method] callback handler
  handler: (req, res) => {
    res.status(401).respond();
  },
};
