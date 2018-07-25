import isString from 'lodash/isString';
import { FileStore as CoreFilesStore } from '../core/files';
import { KinveyError } from '../core/errors';

export class FilesStore extends CoreFilesStore {
  upload(file, metadata = {}, options) {
    if (!(file instanceof global.Blob) && !isString(file)) {
      return Promise.reject(new KinveyError('File must be an instance of a Blob or the content of the file as a string.'));
    }

    metadata = Object.assign({ size: file.size || file.length }, metadata);
    return super.upload(file, metadata, options);
  }
}

export const Files = new FilesStore();
