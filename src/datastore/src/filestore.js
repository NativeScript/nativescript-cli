import Promise from 'es6-promise';
import map from 'lodash/map';
import assign from 'lodash/assign';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';
import url from 'url';

import {
  NetworkRequest,
  KinveyRequest,
  AuthType,
  RequestMethod,
  Headers
} from 'src/request';
import { KinveyError } from 'src/errors';
import { KinveyObservable, Log, isDefined } from 'src/utils';
import Query from 'src/query';
import NetworkStore from './networkstore';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Calculate where we should start the file upload
function getStartIndex(rangeHeader, max) {
  const start = rangeHeader ? parseInt(rangeHeader.split('-')[1], 10) + 1 : 0;
  return start >= max ? max - 1 : start;
}

/**
 * The FileStore class is used to find, save, update, remove, count and group files.
 */
export default class FileStore extends NetworkStore {
  /**
   * @private
   * The pathname for the store.
   *
   * @return  {string}  Pathname
   */
  get pathname() {
    return `/blob/${this.client.appKey}`;
  }

  /**
   * Finds all files. A query can be optionally provided to return
   * a subset of all the files for your application or omitted to return all the files.
   * The number of files returned will adhere to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
   * promise will be returned that will be resolved with the files or rejected with
   * an error.
   *
   * @param   {Query}                 [query]                                   Query used to filter result.
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Boolean}               [options.tls]                             Use Transport Layer Security
   * @param   {Boolean}               [options.download]                        Download the files
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var filesStore = new Kinvey.FilesStore();
   * var query = new Kinvey.Query();
   * query.equalTo('location', 'Boston');
   * files.find(query, {
   *   tls: true, // Use transport layer security
   *   ttl: 60 * 60 * 24, // 1 day in seconds
   *   download: true // download the files
   * }).then(function(files) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  find(query, options = {}) {
    options = assign({ tls: true }, options);
    const queryStringObject = { tls: options.tls === true };

    if (isNumber(options.ttl)) {
      queryStringObject.ttl_in_seconds = parseInt(options.ttl, 10);
    }

    const stream = KinveyObservable.create((observer) => {
      // Check that the query is valid
      if (isDefined(query) && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      // Create the request
      const request = new KinveyRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: this.pathname,
          query: queryStringObject
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
    return stream.toPromise()
      .then((files) => {
        if (options.download === true) {
          return Promise.all(map(files, file => this.downloadByUrl(file._downloadURL, options)));
        }

        return files;
      });
  }

  findById(id, options) {
    return this.download(id, options);
  }

  /**
   * Download a file.
   *
   * @param   {string}        name                                          Name
   * @param   {Object}        [options]                                     Options
   * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
   * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
   * @param   {Boolean}       [options.stream=false]                        Stream the file
   * @return  {Promise<string>}                                             File content
   *
   * @example
   * var files = new Kinvey.Files();
   * files.download('Kinvey.png', {
   *   tls: true, // Use transport layer security
   *   ttl: 60 * 60 * 24, // 1 day in seconds
   *   stream: true // stream the file
   * }).then(function(file) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
  */
  download(name, options = {}) {
    options = assign({ tls: true }, options);
    const queryStringObject = { tls: options.tls === true };

    if (isNumber(options.ttl)) {
      queryStringObject.ttl_in_seconds = parseInt(options.ttl, 10);
    }

    const stream = KinveyObservable.create((observer) => {
      if (isDefined(name) === false) {
        observer.next(undefined);
        return observer.complete();
      }

      const request = new KinveyRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `${this.pathname}/${name}`,
          query: queryStringObject
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
    return stream.toPromise()
      .then((file) => {
        if (options.stream === true) {
          return file;
        }

        options.mimeType = file.mimeType;
        return this.downloadByUrl(file._downloadURL, options);
      });
  }

  /**
   * Download a file using a url.
   *
   * @param   {string}        url                                           File download url
   * @param   {Object}        [options]                                     Options
   * @return  {Promise<string>}                                             File content.
  */
  downloadByUrl(url, options = {}) {
    const request = new NetworkRequest({
      method: RequestMethod.GET,
      url: url,
      timeout: options.timeout
    });
    return request.execute().then(response => response.data);
  }

  /**
   * Stream a file. A promise will be returned that will be resolved with the file or rejected with
   * an error.
   *
   * @param   {string}        name                                          File name
   * @param   {Object}        [options]                                     Options
   * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
   * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
   * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
   * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
   * @return  {Promise}                                                     Promise
   *
   * @example
   * var files = new Kinvey.Files();
   * files.stream('BostonTeaParty.png', {
   *   tls: true, // Use transport layer security
   *   ttl: 60 * 60 * 24, // 1 day in seconds
   * }).then(function(file) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  stream(name, options = {}) {
    options.stream = true;
    return this.download(name, options);
  }

  /**
   * Create the file on Kinvey
   *
   * @private
   */
  saveFileMetadata(options, requestBody) {
    const isUpdate = isDefined(requestBody._id);
    const reqMethod = isUpdate ? RequestMethod.PUT : RequestMethod.POST;
    const reqUrl = url.format({
      protocol: this.client.apiProtocol,
      host: this.client.apiHost,
      pathname: isUpdate ? `${this.pathname}/${requestBody._id}` : this.pathname
    });

    const reqOptions = {
      method: reqMethod,
      authType: AuthType.Default,
      url: reqUrl,
      properties: options.properties,
      timeout: options.timeout,
      body: requestBody,
      client: this.client
    };

    const request = new KinveyRequest(reqOptions);
    request.headers.set('X-Kinvey-Content-Type', requestBody.mimeType);
    return request.execute();
  }

  /**
   * @private
   */
  makeStatusCheckRequest(kinveySaveResponse, metadata, timeout) {
    const headers = new Headers(kinveySaveResponse._requiredHeaders);
    headers.set('content-type', metadata.mimeType);
    headers.set('content-range', `bytes */${metadata.size}`);
    const request = new NetworkRequest({
      method: RequestMethod.PUT,
      url: kinveySaveResponse._uploadURL,
      timeout: timeout,
      headers: headers
    });
    return request.execute();
  }

  /**
   * @private
   */
  getUnexpectedStatusCheckResponsCode(response) {
    const requestId = response.headers.get('X-Kinvey-Request-ID');
    const msg = 'Unexpected response for upload status request';
    return new KinveyError(msg, false, response.statusCode, requestId);
  }

  /**
   * @private
   */
  transformMetadata(file, metaFromUser) {
    const metadata = assign({
      filename: file._filename || file.name,
      public: false,
      size: file.size || file.length,
      mimeType: file.mimeType || file.type || 'application/octet-stream'
    }, metaFromUser);

    metadata._filename = metadata.filename;
    delete metadata.filename;
    metadata._public = metadata.public;
    delete metadata.public;

    return metadata;
  }

  /**
   * @private
   */
  formUploadResponse(data, file) {
    delete data._expiresAt;
    delete data._requiredHeaders;
    delete data._uploadURL;
    data._data = file;
    return data;
  }

  /**
   * Upload a file.
   *
   * @param {Blob|string} file  File content
   * @param {Object} [metadata={}] File metadata
   * @param {Object} [options={}] Options
   * @return {Promise<File>} A file entity.
   */
  upload(file, metadata = {}, options = {}) {
    metadata = this.transformMetadata(file, metadata);
    let kinveySaveData = null;

    return this.saveFileMetadata(options, metadata)
      .then((response) => {
        kinveySaveData = response.data;
        return this.makeStatusCheckRequest(response.data, metadata, options.timeout);
      })
      .then((response) => {
        Log.debug('File upload status check response', response);

        if (!response.isSuccess()) {
          return Promise.reject(response.error);
        }

        if (response.statusCode === 200) {
          return; // file is already uploaded
        }

        if (response.statusCode !== 308) {
          // TODO: Here we should handle redirects according to location header, but this generally shouldn't happen
          const err = this.getUnexpectedStatusCheckResponsCode(response);
          return Promise.reject(err);
        }

        const uploadOptions = {
          start: getStartIndex(response.headers.get('range'), metadata.size),
          timeout: options.timeout,
          maxBackoff: options.maxBackoff,
          headers: kinveySaveData._requiredHeaders
        };
        return this.retriableUpload(kinveySaveData._uploadURL, file, metadata, uploadOptions);
      })
      .then(() => {
        return this.formUploadResponse(kinveySaveData, file);
      });
  }

  /**
   * @private
   */
  resolvePromiseAfter(timeout, resolveWith) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(resolveWith);
      }, timeout || 0);
    });
  }

  /**
   * @private
   */
  handleUploadErrors(uploadResponse) {
    if (uploadResponse.isClientError()) {
      return Promise.reject(uploadResponse.error);
    }
    if (!uploadResponse.isSuccess() && !uploadResponse.isServerError() && uploadResponse.statusCode !== 308) {
      // TODO: Here we should handle redirects according to location header
      return Promise.reject(this.getUnexpectedStatusCheckResponsCode(uploadResponse));
    }
    return Promise.resolve(uploadResponse);
  }

  /**
   * @private
   * This function may mutate the options object param - may change its start or count properties
   */
  handleReuploadCases(uploadResponse, fileSize, options) {
    let backoff = 0;
    const reuploadData = {
      shouldResume: false,
      shouldRetry: false
    };

    if (uploadResponse.isServerError()) { // should retry
      Log.debug('File upload server error. Probably network congestion.', uploadResponse.statusCode, uploadResponse.data);
      backoff = (2 ** options.count) + randomInt(1, 1001); // Calculate the exponential backoff
      if (backoff >= options.maxBackoff) {
        return Promise.reject(uploadResponse.error);
      }
      Log.debug(`File upload will try again in ${backoff} seconds.`);
      reuploadData.shouldRetry = true;
    } else if (uploadResponse.statusCode === 308) { // upload isn't complete, must upload the rest of the file
      Log.debug('File upload was incomplete (statusCode 308). Trying to upload the remainder of file.');
      options.start = getStartIndex(uploadResponse.headers.get('range'), fileSize);
      reuploadData.shouldResume = true;
    }

    return this.resolvePromiseAfter(backoff, reuploadData);
  }

  /**
   * @private
   */
  retriableUpload(url, file, metadata, options) {
    options = assign({
      count: 0,
      start: 0,
      maxBackoff: 32 * 1000
    }, options);

    Log.debug('Start file upload');
    Log.debug('File upload headers', options.headers);
    Log.debug('File upload upload url', url);
    Log.debug('File upload file', file);
    Log.debug('File upload metadata', metadata);
    Log.debug('File upload options', options);

    return this.makeUploadRequest(url, file, metadata, options)
      .then((uploadResponse) => {
        Log.debug('File upload response', uploadResponse);
        return this.handleUploadErrors(uploadResponse);
      })
      .then((uploadResponse) => {
        return this.handleReuploadCases(uploadResponse, metadata.size, options);
      })
      .then((reuploadOptions) => {
        if (reuploadOptions.shouldRetry) { // is retrying after backoff period
          options.count += 1;
        } else {
          options.count = 0;
        }
        if (reuploadOptions.shouldResume || reuploadOptions.shouldRetry) { // should continue with upload
          return this.retriableUpload(url, file, metadata, options);
        }
        // upload complete
      });
  }

  /**
   * @protected
   */
  makeUploadRequest(url, file, metadata, options) {
    const headers = new Headers(options.headers);
    headers.set('content-type', metadata.mimeType);
    headers.set('content-range', `bytes ${options.start}-${metadata.size - 1}/${metadata.size}`);

    const request = new NetworkRequest({
      method: RequestMethod.PUT,
      url: url,
      headers: headers,
      body: isFunction(file.slice) ? file.slice(options.start) : file,
      timeout: options.timeout
    });

    return request.execute();
  }

  /**
   * @private
   */
  create(file, metadata, options) {
    return this.upload(file, metadata, options);
  }

  /**
   * @private
   */
  update(file, metadata, options) {
    return this.upload(file, metadata, options);
  }

  /**
   * @private
   */
  remove() {
    throw new KinveyError('Please use removeById() to remove files one by one.');
  }
}
