import isFunction from 'lodash/isFunction';
import * as bghttp from 'nativescript-background-http';
import { File } from 'tns-core-modules/file-system';
import { transformMetadata, saveFileMetadata } from 'kinvey-js-sdk/lib/files/upload';
import { KinveyError } from 'kinvey-js-sdk/lib/errors';

const MAX_BACKOFF = 32 * 1000;

function uploadFile(url: string, file: File, metadata: any, options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const session = bghttp.session('file-upload');
    const request = {
      url,
      method: 'POST',
      headers: Object.assign({}, options.headers, {
        'Content-Type': metadata.mimeType
      }),
      description: 'Kinvey File Upload'
    };
    const task = session.uploadFile(file.path, request);

    task.on('error', (e) => {
      reject(e.error);
    });

    task.on('cancelled', (e) => {
      reject(new KinveyError(`File upload for ${file.path} has been cancelled.`));
    });

    if (isFunction(options.onProgress)) {
      task.on('progress', (e) => {
        options.onProgress(e);
      });
    }

    task.on('complete', () => {
      resolve();
    });
  });
}

export async function upload(filePath: string | File, metadata: any = {}, options: any = {}) {
  let file;

  if (filePath instanceof File) {
    file = filePath;
  } else if (File.exists(filePath)) {
    file = File.fromPath(filePath);
  } else {
    throw new KinveyError(`A file does not exist at ${filePath}.`);
  }

  const fileMetadata = transformMetadata(file, metadata);
  const kinveyFile = await saveFileMetadata(fileMetadata, options);
  await uploadFile(kinveyFile._uploadURL, file, fileMetadata, {
    timeout: options.timeout,
    headers: kinveyFile._requiredHeaders,
    onProgress: options.onProgress
  });

  delete kinveyFile._expiresAt;
  delete kinveyFile._requiredHeaders;
  delete kinveyFile._uploadURL;
  return kinveyFile;
}
