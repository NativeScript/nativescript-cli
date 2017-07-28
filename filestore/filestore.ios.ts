import { File } from 'tns-core-modules/file-system';
import { KinveyError, KinveyResponse } from 'kinvey-js-sdk/dist/export';
import { CommonFileStore, FileMetadata, FileUploadRequestOptions } from './common';

export class FileStore extends CommonFileStore {
  private makeUploadRequest(url: string, file: File, metadata: FileMetadata, options: FileUploadRequestOptions)
  private makeUploadRequest(url: string, filePath: string, metadata: FileMetadata, options: FileUploadRequestOptions)
  private makeUploadRequest(url: string, file: string | File, metadata: FileMetadata, options: FileUploadRequestOptions) {
    return new Promise((resolve, reject) => {
      const filePath = file instanceof File ? file.path : file;
      const nsFileUrl = NSURL.fileURLWithPath(filePath);
      const nsUrl = NSURL.URLWithString(url);
      const nsRequest = NSMutableURLRequest.requestWithURL(nsUrl);
      nsRequest.HTTPMethod = 'PUT';

      options.headers['content-type'] = metadata.mimeType;
      options.headers['content-range'] = `bytes ${options.start}-${metadata.size - 1}/${metadata.size}`;
      for (const header in options.headers) {
        nsRequest.setValueForHTTPHeaderField(options.headers[header], header);
      }

      const nsSessionConfig = NSURLSessionConfiguration.defaultSessionConfiguration;
      nsSessionConfig.timeoutIntervalForRequest = options.timeout / 1000;
      nsSessionConfig.timeoutIntervalForResource = options.timeout / 1000;
      const nsSession = NSURLSession.sessionWithConfiguration(nsSessionConfig);
      const uploadTask = nsSession.uploadTaskWithRequestFromFileCompletionHandler(nsRequest, nsFileUrl, (data: NSData, response: NSURLResponse, error: NSError) => {
        if (error) {
          reject(new KinveyError(error.localizedDescription));
        } else {
          resolve(this.createKinveyResponse(data, response as NSHTTPURLResponse));
        }
      });
      uploadTask.resume();
    });
  }

  private createKinveyResponse(data: NSData, response: NSHTTPURLResponse) {
    const config = {
      statusCode: response.statusCode,
      headers: {},
      data: NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding)
    }

    for (const headerField in response.allHeaderFields) {
      config.headers[headerField] = response.allHeaderFields[headerField];
    }

    return new KinveyResponse(config);
  }
}
