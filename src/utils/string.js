import uid from 'uid';

/**
 * @private
 */
export function byteCount(str) {
  let count = 0;
  const stringLength = str.length;
  str = String(str || '');

  for (let i = 0; i < stringLength; i++) {
    const partCount = encodeURI(str[i]).split('%').length;
    count += partCount === 1 ? 1 : partCount - 1;
  }

  return count;
}

export function randomString(size, prefix = '') {
  return `${prefix}${uid(size)}`;
}
