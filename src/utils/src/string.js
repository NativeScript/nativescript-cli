import uid from 'uid';

/**
 * @private
 */
export function randomString(size, prefix = '') {
  return `${prefix}${uid(size)}`;
}
