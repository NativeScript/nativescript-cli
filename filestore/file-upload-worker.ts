import { KinveyResponse } from 'kinvey-js-sdk/dist/export';
import { BaseWorker } from '../base-worker';
import {
  FileMetadata,
  FileUploadRequestOptions,
  KinveyResponseData
} from './common';

export interface FileUploadWorkerOptions {
  url: string,
  metadata: FileMetadata,
  options: FileUploadRequestOptions,
  filePath: string,
}

export class FileUploadWorker extends BaseWorker {
  upload(options: FileUploadWorkerOptions) {
    return this.postMessage(options)
      .then((respData: KinveyResponseData) => new KinveyResponse(respData));
  }
}
