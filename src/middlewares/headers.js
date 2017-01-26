/**
 * Sets basic headers for all routes.
 * @file
 */

export default function headers(req, res, next) {
  // All responses will be in JSON, so set the content type header for every request.
  res.header('Content-Type', 'application/json');
  res.header('X-Powered-By', 'Code Jobs');
  next();
}
