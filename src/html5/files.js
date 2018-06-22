import { FileStore as CoreFilesStore } from '../core/files';
import { KinveyError } from '../core/errors';

export class FilesStore extends CoreFilesStore {
  upload(file, metadata = {}, options) {
    if (!(file instanceof global.Blob)) {
      return Promise.reject(new KinveyError('File must be an instance of a Blob.'));
    }

    metadata.size = file.size;
    return super.upload(file, metadata, options);
  }
}

export const Files = new FilesStore();
