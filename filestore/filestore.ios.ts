import { File } from 'tns-core-modules/file-system';
import { KinveyError, KinveyResponse } from 'kinvey-js-sdk/dist/export';
import { FileStore as CoreFileStore } from 'kinvey-js-sdk/dist/datastore';
import { FileMetadata, FileUploadRequestOptions } from './common';

export class FileStore extends CoreFileStore {
  public upload(file: File, metadata: any, options: any)
  public upload(filePath: string, metadata: any, options: any)
  public upload(filePath: string | File, metadata: any, options: any) {
    if (filePath instanceof File) {
      filePath = filePath.path;
    }

    if (File.exists(filePath) === false) {
      return Promise.reject(new KinveyError('File does not exist'));
    }

    return super.upload(filePath, metadata, options);
  }

  private makeUploadRequest(url: string, file: File, metadata: FileMetadata, options: FileUploadRequestOptions)
  private makeUploadRequest(url: string, filePath: string, metadata: FileMetadata, options: FileUploadRequestOptions)
  private makeUploadRequest(url: string, filePath: string | File, metadata: FileMetadata, options: FileUploadRequestOptions) {
    return new Promise((resolve, reject) => {
      if (filePath instanceof File) {
        filePath = filePath.path;
      }

      options.headers['content-type'] = metadata.mimeType;
      options.headers['content-range'] = `bytes ${options.start}-${metadata.size - 1}/${metadata.size}`;

      const nsUrl = NSURL.URLWithString(url);
      const nsRequest = NSMutableURLRequest.requestWithURL(nsUrl);
      nsRequest.HTTPMethod = 'PUT';

      for (const header in options.headers) {
        nsRequest.setValueForHTTPHeaderField(options.headers[header], header);
      }

      const nsFileUrl = NSURL.fileURLWithPath(filePath);
      const uploadTask = NSURLSession.sharedSession.uploadTaskWithRequestFromFileCompletionHandler(nsRequest, nsFileUrl, (nsData: NSData, nsResponse: NSURLResponse, nsError: NSError) => {
        if (nsError) {
          reject(new KinveyError(nsError.localizedDescription));
        } else {
          resolve(this.createKinveyResponse(nsData, nsResponse as NSHTTPURLResponse));
        }
      });
      uploadTask.resume();
    });
  }

  private createKinveyResponse(nsData: NSData, nsResponse: NSHTTPURLResponse) {
    const config = {
      statusCode: nsResponse.statusCode,
      headers: {},
      data: NSString.alloc().initWithDataEncoding(nsData, NSUTF8StringEncoding)
    }

    for (const headerField in nsResponse.allHeaderFields) {
      config[headerField] = nsResponse.allHeaderFields[headerField];
    }

    return new KinveyResponse(config);
  }
}
