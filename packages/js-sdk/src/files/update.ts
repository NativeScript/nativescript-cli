import { upload } from './upload';

export async function update(file: any, metadata: any, options?: any) {
  return upload(file, metadata, options);
}
