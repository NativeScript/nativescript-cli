declare const global: any;
require('globals'); // necessary to bootstrap tns modules on the new thread
import { File } from 'tns-core-modules/file-system';
import {
  FileUploadRequestOptions,
  KinveyResponseConfig,
  FileMetadata,
  FileUploadWorkerOptions
} from './common';

global.onmessage = function (msg: { data: FileUploadWorkerOptions }) {
  const response = upload(msg.data);
  global.postMessage({
    statusCode: response.code(),
    headers: mapHeaders(response.headers()),
    data: response.body().string()
  });
};

function upload(workerOptions: FileUploadWorkerOptions): okhttp3.Response {
  const { url, filePath, metadata, options } = workerOptions;
  const byteArray = File.fromPath(filePath).readSync();
  const client = buildClient(options);
  const request = buildRequest(url, byteArray, metadata, options);
  return client.newCall(request).execute();
}

function buildClient(options: FileUploadRequestOptions): okhttp3.OkHttpClient {
  let client = new okhttp3.OkHttpClient.Builder();

  if (options.timeout > 0) {
    client = client.connectTimeout(options.timeout, java.util.concurrent.TimeUnit.MILLISECONDS)
      .writeTimeout(options.timeout, java.util.concurrent.TimeUnit.MILLISECONDS);
  }

  return client.build();
}

function buildRequest(url: string, byteArray: Int8Array, metadata: FileMetadata, options: FileUploadRequestOptions): okhttp3.Request {
  const mediaType = okhttp3.MediaType.parse(metadata.mimeType);
  const byteCount = metadata.size - options.start;
  const reqBody = okhttp3.RequestBody.create(mediaType, byteArray, options.start, byteCount);
  let requestBuilder = new okhttp3.Request.Builder()
    .url(url)
    .put(reqBody);

  for (const headerName in options.headers) {
    requestBuilder = requestBuilder.header(headerName, options.headers[headerName]);
  }

  return requestBuilder.build();
}

function mapHeaders(javaHeaders: okhttp3.Headers): {} {
  const headers = {};
  for (let i = 0; i < javaHeaders.size(); i += 1) {
    headers[javaHeaders.name(i).toLowerCase()] = javaHeaders.value(i);
  }
  return headers;
}
