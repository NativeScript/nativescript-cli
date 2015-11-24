const defaultObjectIdPrefix = 'local_';

function generateObjectId(length = 24, prefix = defaultObjectIdPrefix) {
  const chars = 'abcdef0123456789';
  let objectId = '';

  for (let i = 0, j = chars.length; i < length; i++) {
    const pos = Math.floor(Math.random() * j);
    objectId += chars.substring(pos, pos + 1);
  }

  objectId = prefix + objectId;
  return objectId;
}

module.exports = {
  generateObjectId: generateObjectId
};
