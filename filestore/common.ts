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
