/**
 * @private
 */
export const invalidOrMissingCheckRegexp = new RegExp('(invalid)|(missing)', 'i');

/**
 * @private
 */
export const notInitializedCheckRegexp = new RegExp('not.*initialized', 'i');

/**
 * @private
 */
export const alreadyInitializedCheckRegexp = new RegExp('already initialized', 'i');
