import { File } from 'tns-core-modules/file-system';
import { BaseNativeScriptFileStore, FileMetadata, FileUploadRequestOptions } from './common';
import { FileUploadWorker } from './file-upload-worker';

export class NativeScriptFileStore extends BaseNativeScriptFileStore {

  protected makeUploadRequest(url: string, file: File, metadata: FileMetadata, options: FileUploadRequestOptions)
  protected makeUploadRequest(url: string, filePath: string, metadata: FileMetadata, options: FileUploadRequestOptions)
  protected makeUploadRequest(url: string, file: string | File, metadata: FileMetadata, options: FileUploadRequestOptions) {
    options.headers['content-type'] = metadata.mimeType;
    options.headers['content-range'] = `bytes ${options.start}-${metadata.size - 1}/${metadata.size}`;

    const filePath = file instanceof File ? file.path : file;
    const worker = new FileUploadWorker(__dirname, './file-upload-worker-script');
    return worker.upload({ url, metadata, options, filePath });
  }
}
