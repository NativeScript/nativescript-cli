import { File } from 'tns-core-modules/file-system';
import { KinveyError, KinveyResponse } from 'kinvey-js-sdk/dist/export';
import { NativeScriptFileStore, FileMetadata, FileUploadRequestOptions } from './common';

export class FileStore extends NativeScriptFileStore {
  protected makeUploadRequest(url: string, file: File, metadata: FileMetadata, options: FileUploadRequestOptions)
  protected makeUploadRequest(url: string, filePath: string, metadata: FileMetadata, options: FileUploadRequestOptions)
  protected makeUploadRequest(url: string, filePath: string | File, metadata: FileMetadata, options: FileUploadRequestOptions) {
    return new Promise((resolve, reject) => {
      if (filePath instanceof File) {
        filePath = filePath.path;
      }

      if (File.exists(filePath) === false) {
        return reject(new KinveyError('File does not exist'));
      }

      options.headers['content-type'] = metadata.mimeType;
      options.headers['content-range'] = `bytes 0-${metadata.size - 1}/${metadata.size}`;

      const nsUrl = NSURL.URLWithString(url);
      const request = NSMutableURLRequest.requestWithURL(nsUrl);
      request.HTTPMethod = 'PUT';

      for (const header in options.headers) {
        request.setValueForHTTPHeaderField(options.headers[header], header);
      }

      const nsFilePath = NSURL.fileURLWithPath(filePath);
      const uploadTask = NSURLSession.sharedSession.uploadTaskWithRequestFromFileCompletionHandler(request, nsFilePath, (data: NSData, response: NSURLResponse, error: NSError) => {
        if (error) {
          reject(error);
        } else {
          console.log(data, response);
          resolve(response);
        }
      });
      uploadTask.resume();
    });
  }
}