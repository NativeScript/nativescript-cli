import { File } from 'tns-core-modules/file-system';
import { CommonFileStore, FileMetadata, FileUploadRequestOptions, FileUploadWorker } from './common';
import * as workerPath from 'file-loader?name=[name].js!./file-upload-worker-android';

export class FileStore extends CommonFileStore {
  private makeUploadRequest(url: string, file: File, metadata: FileMetadata, options: FileUploadRequestOptions);
  private makeUploadRequest(url: string, filePath: string, metadata: FileMetadata, options: FileUploadRequestOptions);
  private makeUploadRequest(url: string, file: string | File, metadata: FileMetadata, options: FileUploadRequestOptions) {
    const filePath = file instanceof File ? file.path : file;
    const worker = new FileUploadWorker(workerPath);
    options.headers['content-type'] = metadata.mimeType;
    options.headers['content-range'] = `bytes ${options.start}-${metadata.size - 1}/${metadata.size}`;
    return worker.upload({ url, metadata, options, filePath });
  }

  protected getFileSize(filePath: string | File): number {
    if (filePath instanceof File) {
      filePath = filePath.path;
    }

    return new java.io.File(filePath).length();
  }
}
