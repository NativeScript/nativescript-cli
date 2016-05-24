import uid from 'uid';

export function randomString(size, prefix = '') {
  return `${prefix}${uid(size)}`;
}
