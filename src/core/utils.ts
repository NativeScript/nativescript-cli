// eslint-disable-next-line import/prefer-default-export
export function generateId(length = 24) {
  const chars = 'abcdef0123456789';
  let id = '';

  for (let i = 0, j = chars.length; i < length; i += 1) {
    const pos = Math.floor(Math.random() * j);
    id += chars.substring(pos, pos + 1);
  }

  return id;
}
