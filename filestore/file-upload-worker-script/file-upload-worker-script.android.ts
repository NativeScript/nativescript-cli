declare const okhttp3: any, global: any;
require('globals'); // necessary to bootstrap tns modules on the new thread
import { File } from 'tns-core-modules/file-system';
import { FileUploadWorkerOptions } from '../file-upload-worker';
import {
  FileUploadRequestOptions,
  KinveyResponseData,
  FileMetadata
} from '../common';

function javaUpload(url: string, byteArray: Int8Array, metadata: FileMetadata, options: FileUploadRequestOptions) {
  const client = buildClient(options);
  const request = buildRequest(url, byteArray, metadata, options);
  return client.newCall(request).execute();
}

function buildClient(options) {
  let client = new okhttp3.OkHttpClient.Builder();

  if (options.timeout) {
    client = client.connectTimeout(options.timeout, java.util.concurrent.TimeUnit.MILLISECONDS)
      .writeTimeout(options.timeout, java.util.concurrent.TimeUnit.MILLISECONDS);
  }

  return client.build();
}

function buildRequest(url: string, byteArray: Int8Array, metadata: FileMetadata, options: FileUploadRequestOptions) {
  const mediaType = okhttp3.MediaType.parse(metadata.mimeType);
  const byteCount = metadata.size - options.start;
  const reqBody = new okhttp3.RequestBody.create(mediaType, byteArray, options.start, byteCount);
  let requestBuilder = new okhttp3.Request.Builder()
    .url(url)
    .put(reqBody);

  for (const headerName in options.headers) {
    requestBuilder = requestBuilder.header(headerName, options.headers[headerName]);
  }

  return requestBuilder.build();
}

function serializeResponse(response) {
  const serialized: KinveyResponseData = {
    statusCode: response.code(),
    headers: mapHeaders(response.headers())
  } as any;

  serialized.data = mapBody(response.body(), serialized.headers['content-type']);
  return serialized;
}

function mapHeaders(javaHeaders) {
  const headers = {};
  for (let i = 0; i < javaHeaders.size(); i += 1) {
    headers[javaHeaders.name(i).toLowerCase()] = javaHeaders.value(i);
  }
  return headers;
}

function mapBody(javaBody, contentType) {
  const bodyStr = javaBody.string();
  let result;
  if (contentTypeIsJson(contentType)) {
    result = tryParseJson(bodyStr);
  } else {
    result = bodyStr;
  }

  return result;
}

function upload(workerOptions: FileUploadWorkerOptions) {
  const { url, filePath, metadata, options } = workerOptions;
  const byteArray = File.fromPath(filePath).readSync();
  return javaUpload(url, byteArray, metadata, options);
}

function contentTypeIsJson(contentType) {
  return !!contentType && contentType.toLowerCase().indexOf('application/json') !== -1;
}

function tryParseJson(jsonString) {
  let result;
  try {
    result = JSON.parse(jsonString);
  } catch (e) {
  }
  return result;
}

global.onmessage = function (msg: { data: FileUploadWorkerOptions }) {
  const javaResponse = upload(msg.data);
  const serialized = serializeResponse(javaResponse);
  global.postMessage(serialized);
}
