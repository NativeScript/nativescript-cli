import { formatKinveyUrl } from '../http/utils';
import { Request, KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import { Headers } from '../http/headers';
import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';

const NAMESPACE = 'blob';
const MAX_BACKOFF = 32 * 1000;

function transformMetadata(file = {}, metadata = {}) {
  const fileMetadata = Object.assign({}, {
    filename: file._filename || file.name,
    public: false,
    size: file.size || file.length,
    mimeType: file.mimeType || file.type || 'application/octet-stream'
  }, metadata);
  fileMetadata._filename = metadata.filename;
  delete fileMetadata.filename;
  fileMetadata._public = metadata.public;
  delete fileMetadata.public;
  return fileMetadata;
}

async function saveFileMetadata(metadata, options = {}) {
  const { apiProtocol, apiHost, appKey } = getConfig();

  if (metadata.size <= 0) {
    throw new KinveyError('Unable to create a file with a size of 0.');
  }

  const request = new KinveyRequest({
    method: metadata._id ? RequestMethod.PUT : RequestMethod.POST,
    headers: {
      'X-Kinvey-Content-Type': metadata.mimeType
    },
    auth: Auth.Default,
    url: metadata._id ? formatKinveyUrl(apiProtocol, apiHost, `/${NAMESPACE}/${appKey}/${metadata._id}`) : formatKinveyUrl(apiProtocol, apiHost, `/${NAMESPACE}/${appKey}`),
    body: metadata,
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}

function checkUploadStatus(url, headers, metadata, timeout) {
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Content-Type', metadata.mimeType);
  requestHeaders.set('Content-Range', `bytes */${metadata.size}`);
  const request = new Request({
    method: RequestMethod.PUT,
    headers: requestHeaders,
    url,
    timeout
  });
  return request.execute();
}

function getStartIndex(rangeHeader, max) {
  const start = rangeHeader ? parseInt(rangeHeader.split('-')[1], 10) + 1 : 0;
  return start >= max ? max - 1 : start;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

async function uploadFile(url, file, metadata, options = {}) {
  const { count = 0, maxBackoff = MAX_BACKOFF } = options;
  let { start = 0 } = options;

  const requestHeaders = new Headers(options.headers);
  requestHeaders.set('Content-Type', metadata.mimeType);
  requestHeaders.set('Content-Range', `bytes ${options.start}-${metadata.size - 1}/${metadata.size}`);
  const request = new Request({
    method: RequestMethod.PUT,
    headers: requestHeaders,
    url,
    body: file.slice(options.start, metadata.size),
    timeout: options.timeout
  });
  const response = await request.execute();

  if (!response.isSuccess()) {
    // An error occurred. We should retry uploading the file after some time has passed
    if (response.statusCode >= 500 && response.statusCode < 600) {
      const backoff = (2 ** options.count) + randomInt(1, 1001); // Calculate the exponential backoff

      if (backoff < options.maxBackoff) {
        await new Promise((resolve) => {
          setTimeout(resolve, backoff);
        });
        return uploadFile(url, file, metadata, { count: count + 1, start, maxBackoff });
      }
    }

    throw response.error;
  }

  // The upload isn't complete and we must upload the rest of the file
  if (response.statusCode === 308) {
    start = getStartIndex(response.headers.get('Range'), metadata.size);
    return uploadFile(url, file, metadata, { count: 0, start, maxBackoff });
  }

  return response.data;
}

export default async function upload(file = {}, metadata = {}, options = {}) {
  const fileMetadata = transformMetadata(file, metadata);
  const kinveyFile = await saveFileMetadata(fileMetadata, options);
  const uploadStatusResponse = await checkUploadStatus(kinveyFile._uploadURL, kinveyFile._requiredHeaders, fileMetadata, options.timeout);

  if (!uploadStatusResponse.isSuccess()) {
    throw uploadStatusResponse.error;
  }

  if (uploadStatusResponse.statusCode !== 200 && uploadStatusResponse.statusCode !== 201) {
    if (uploadStatusResponse.statusCode !== 308) {
      // TODO: Here we should handle redirects according to location header, but this generally shouldn't happen
      throw new KinveyError('Unexpected response for upload file status check request.');
    }

    const uploadOptions = {
      start: getStartIndex(uploadStatusResponse.headers.get('Range'), metadata.size),
      timeout: options.timeout,
      maxBackoff: options.maxBackoff,
      headers: kinveyFile._requiredHeaders
    };
    await uploadFile(kinveyFile._uploadURL, file, fileMetadata, uploadOptions);
  }

  delete kinveyFile._expiresAt;
  delete kinveyFile._requiredHeaders;
  delete kinveyFile._uploadURL;
  kinveyFile._data = file;
  return kinveyFile;
}
