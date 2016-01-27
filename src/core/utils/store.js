const objectIdPrefix = process.env.KINVEY_OBJECT_ID_PREFIX || 'local_';

/**
 * @private
 */
export function generateObjectId(length = 24, prefix = objectIdPrefix) {
  const chars = 'abcdef0123456789';
  let objectId = '';

  for (let i = 0, j = chars.length; i < length; i++) {
    const pos = Math.floor(Math.random() * j);
    objectId += chars.substring(pos, pos + 1);
  }

  objectId = prefix + objectId;
  return objectId;
}
