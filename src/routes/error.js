/**
 * A "catch all" route that sends back 500 - Internal Server Error.
 * @export
 */
export default {
  // The method this route applies to.
  method: 'all',
  // A string used to match routes (i.e app[method]([match]))
  match: '/error',
  // The app[method] callback handler
  handler: (req, res) => {
    res.status(500).respond({ message: 'Internal Server Error' });
  },
};
