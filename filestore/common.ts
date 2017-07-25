import { File } from 'tns-core-modules/file-system';
import { isAndroid } from 'tns-core-modules/platform';
import { FileStore as CoreFileStore } from 'kinvey-js-sdk/dist/datastore';
import { KinveyError } from 'kinvey-js-sdk/dist/export';
import { KinveyResponse } from 'kinvey-js-sdk/dist/export';
import { Kinvey } from '../kinvey'
import {
  session,
  Session,
  Request as BackgroundRequest,
  ResultEventData,
  ErrorEventData
} from 'nativescript-background-http';

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
  maxBackoff: number;
  headers: { [key: string]: string }
}

export class NativeScriptFileStore extends CoreFileStore {
  protected static readonly sessionName = 'kinvey-file-upload';
  protected session: Session = null;

  constructor(collection: string, options = {}) {
    super(collection, options);
    this.session = session(NativeScriptFileStore.sessionName);
  }

  protected makeUploadRequest(url: string, file: File, metadata: FileMetadata, options: FileUploadRequestOptions)
  protected makeUploadRequest(url: string, filePath: string, metadata: FileMetadata, options: FileUploadRequestOptions)
  protected makeUploadRequest(url: string, filePath: string | File, metadata: FileMetadata, options: FileUploadRequestOptions) {
    return Promise.reject(new KinveyError('This method must be overridden.'));
  }

  protected parseResponseBody(body: string) {
    let result: any = null;
    try {
      result = JSON.parse(body);
    } catch (ex) {
      result = body;
    }
    return result;
  }
}
