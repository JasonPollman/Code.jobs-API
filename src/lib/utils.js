import util from 'util';

/**
 * Convenience function for util.inspect
 * @param {any} item The item to inspect.
 * @returns {string} The formatted string.
 */
export function inspect(item) {
  return util.inspect(item, { colors: true, depth: 10 });
}

/**
 * Used to sort routes based on specificity.
 * @param a A route to sort.
 * @param b A route to compare to a.
 * @returns {number} -1, 1, or 0 based on the comparison of a and b.
 */
export function sortRoute(a, b) {
  if (a.specificity < b.specificity) return -1;
  return a.specificity > b.specificity ? 1 : 0;
}
