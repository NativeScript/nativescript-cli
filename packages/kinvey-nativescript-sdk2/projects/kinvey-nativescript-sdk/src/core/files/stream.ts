import findById from './findById';

export default async function stream(id, options) {
  return findById(id, Object.assign({}, options, { stream: true }));
}
