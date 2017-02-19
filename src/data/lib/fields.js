/**
 * Exports a set of commonly used database fields.
 * @file
 */

/**
 * Used by non-paginated routes to get the "first" record.
 * @type {object}
 */
export const FIRST = {
  coerce: x => x !== 'false',
  required: false,
  default: true,
};

/**
 * Commonly used.
 * @type {object}
 */
export const STRING_REQUIRED = {
  type: 'string',
  required: true,
};

/**
 * Used by paginated routes.
 * @type {object}
 */
export const PAGINATED = {
  sortDirection: {
    required: false,
    allowed: ['ASC', 'DESC'],
    default: 'ASC',
    coerce: string => string.toUpperCase(),
  },
  sortBy: {
    required: false,
    type: 'string',
    default: 'id',
  },
  limit: {
    required: false,
    coerce: Number,
    default: 1000,
  },
  offset: {
    required: false,
    coerce: Number,
    default: 0,
  },
};
