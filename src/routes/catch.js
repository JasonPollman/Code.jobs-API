/**
 * A "catch all" route that sends back 404.
 * @export
 */

export default {
  // The method this route applies to.
  method: 'all',
  // Moves this route up/down based on "z-index"
  specificity: Number.MAX_VALUE,
  // A string used to match routes (i.e app[method]([match]))
  match: '*',
  // The app[method] callback handler
  handler: (req, res) => {
    res.status(404).respond();
  },
};
