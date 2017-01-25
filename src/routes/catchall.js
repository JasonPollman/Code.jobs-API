/**
 * A "catch all" route that sends back 401 - Unauthorized.
 * @export
 */

export default [
  {
    method: 'ALL',
    specificity: Number.MAX_VALUE,
    permission: 'none',
    match: '*',
    handler: (req, res, next) => {
      res.status(401).json({ message: 'Unauthorized', success: false });
      next();
    },
  },
];
