import { findById } from './findById';

export async function stream(id: string, options?: any) {
  return findById(id, Object.assign({}, options, { stream: true }));
}
