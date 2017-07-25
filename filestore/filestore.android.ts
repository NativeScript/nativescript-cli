import { File } from 'tns-core-modules/file-system';
import { KinveyError, KinveyResponse } from 'kinvey-js-sdk/dist/export';
import {
  Request as BackgroundRequest,
  ResultEventData,
  ErrorEventData
} from 'nativescript-background-http';
import { NativeScriptFileStore, FileMetadata, FileUploadRequestOptions } from './common';


export class FileStore extends NativeScriptFileStore {
  protected makeUploadRequest(url: string, file: File, metadata: FileMetadata, options: FileUploadRequestOptions)
  protected makeUploadRequest(url: string, filePath: string, metadata: FileMetadata, options: FileUploadRequestOptions)
  protected makeUploadRequest(url: string, filePath: string | File, metadata: FileMetadata, options: FileUploadRequestOptions) {
    if (filePath instanceof File) {
      filePath = filePath.path;
    }

    if (File.exists(filePath) === false) {
      return Promise.reject(new KinveyError('File does not exist'));
    }

    const request = this.buildBackgroundRequestObj(url, metadata, options);
    const task = this.session.uploadFile(filePath, request);
    return new Promise((resolve, reject) => {
      const responseData: { statusCode: number, data?: any, headers?: any } = {} as any;
      let wasError = false;

      task.on('error', (eventData: ErrorEventData) => {
        responseData.data = eventData.error;
        responseData.statusCode = 500;
        wasError = true;
      });

      task.on('responded', (eventData: ResultEventData) => {
        const body = this.parseResponseBody(eventData.data);
        responseData.data = body;
      });

      task.on('complete', (eventData: any) => {
        const response = new KinveyResponse(this.responseToJsObject(eventData.response));
        if (wasError) {
          reject(response);
        } else {
          resolve(response);
        }
      });
    });
  }

  private buildBackgroundRequestObj(url: string, metadata: FileMetadata, options: FileUploadRequestOptions) {
    options.headers['content-type'] = metadata.mimeType;
    options.headers['content-range'] = `bytes 0-${metadata.size - 1}/${metadata.size}`;

    return {
      method: 'PUT',
      url: url,
      headers: options.headers,
      description: `Uploading ${metadata._filename || 'file'}`
    } as BackgroundRequest;
  }

  private responseToJsObject(response): {} {
    const obj = {
      statusCode: response.getHttpCode(),
      headers: {},
      data: response.data
    }

    const headerMap = response.getHeaders();
    const headerNames = headerMap.keySet().toArray();

    for (const header of headerNames) {
      obj.headers[header] = headerMap.get(header);
    }

    return obj;
  }
}
