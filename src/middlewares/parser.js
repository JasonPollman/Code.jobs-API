/**
 * Exports the body parser middleware
 * @file
 */

import parser from 'body-parser';

export default parser.urlencoded({ extended: true });
