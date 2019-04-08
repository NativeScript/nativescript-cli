import { download } from './download';

export function findById(id: string, options?: any) {
  return download(id, options);
}
