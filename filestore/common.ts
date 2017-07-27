import { File } from 'tns-core-modules/file-system';
import { KinveyError } from 'kinvey-js-sdk/dist/export';
import { FileStore as CoreFileStore } from 'kinvey-js-sdk/dist/datastore';

export interface FileMetadata {
  _id?: string;
  _filename?: string;
  _public?: boolean;
  mimeType?: string;
  size?: number;
}

export interface FileUploadRequestOptions {
  count: number;
  start: number;
  timeout: number;
  maxBackoff: number;
  headers: { [key: string]: string }
}

export interface KinveyResponseData {
  statusCode: number;
  data?: any;
  headers?: any;
}

export class BaseNativeScriptFileStore extends CoreFileStore {

  upload(file: File, metadata: any, options: any)
  upload(filePath: string, metadata: any, options: any)
  upload(filePath: string | File, metadata: any, options: any) {
    const err = this.validateFile(filePath);
    if (err) {
      return Promise.reject(err);
    }

    return super.upload(filePath, metadata, options);
  }

  protected validateFile(file: string | File) {
    const filePath = file instanceof File ? file.path : file;

    if (File.exists(filePath) === false) {
      return Promise.reject(new KinveyError('File does not exist'));
    }
  }
}
