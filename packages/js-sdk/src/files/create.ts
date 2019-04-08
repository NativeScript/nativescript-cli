import { upload } from './upload';

export async function create(file: any, metadata: any, options?: any) {
  return upload(file, metadata, options);
}
