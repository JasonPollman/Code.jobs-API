/**
 * Exports the body parser middleware
 * @file
 */

import parser from 'body-parser';

const options = {
  extended: true,
};

export default {
  urlencodedBodyParser: parser.urlencoded(options),
  JSONBodyParser: parser.json(options),
};
