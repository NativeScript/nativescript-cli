/* eslint-disable no-underscore-dangle */
import { NetworkRequest } from './requests/network';
import { AuthType, RequestMethod, KinveyRequestConfig } from './requests/request';
import { DataStore } from './datastore';
import url from 'url';
import map from 'lodash/map';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const filesNamespace = process.env.KINVEY_FILES_NAMESPACE || 'blob';

/**
 * The FileStore class is used to find, save, update, remove, count and group files.
 */
export class FileStore extends DataStore {
  constructor() {
    super();
    this.disableCache();
  }

  /**
   * Enable cache.
   *
   * @return {DataStore}  DataStore instance.
   */
  enableCache() {
    // Log a warning
    // throw new KinveyError('Unable to enable cache for the file store.');
  }

  /**
   * Make the store offline.
   *
   * @return {DataStore}  DataStore instance.
   */
  offline() {
    // Log a warning
    // throw new KinveyError('Unable to go offline for the file store.');
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}  Pathname
   */
  get pathname() {
    return `/${filesNamespace}/${this.client.appKey}`;
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
  async find(query, options = {}) {
    options.query = options.query || {};
    options.query.tls = options.tls === true;
    options.ttl_in_seconds = options.ttl;

    const stream = super.find(query, options);
    const files = await stream.toPromise();

    if (options.download === true) {
      return Promise.all(map(files, file => this.downloadByUrl(file._downloadURL, options)));
    }

    return files;
  }

  findById(id, options) {
    return this.download(id, options);
  }

  /**
   * Download a file. A promise will be returned that will be resolved with the file or rejected with
   * an error.
   *
   * @param   {string}        name                                          Name
   * @param   {Object}        [options]                                     Options
   * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
   * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
   * @param   {Boolean}       [options.stream]                              Stream the file
   * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
   * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
   * @return  {Promise}                                                     Promise
   *
   * @example
   * var files = new Kinvey.Files();
   * files.download('BostonTeaParty.png', {
   *   tls: true, // Use transport layer security
   *   ttl: 60 * 60 * 24, // 1 day in seconds
   *   stream: true // stream the file
   * }).then(function(file) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
  */
  async download(name, options = {}) {
    options.query = options.query || {};
    options.query.tls = options.tls === true;
    options.ttl_in_seconds = options.ttl;

    const stream = super.findById(name, options);
    const file = await stream.toPromise();

    if (options.stream === true) {
      return file;
    }

    return this.downloadByUrl(file._downloadURL, options);
  }

  async downloadByUrl(url, options = {}) {
    const config = new KinveyRequestConfig({
      method: RequestMethod.GET,
      url: url,
      timeout: options.timeout
    });
    config.headers.set('Accept', options.mimeType || 'application-octet-stream');
    config.headers.remove('Content-Type');
    config.headers.remove('X-Kinvey-Api-Version');
    const request = new NetworkRequest(config);
    const response = await request.execute();
    return response.data;
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

  async upload(file, metadata = {}, options = {}) {
    metadata._filename = metadata._filename || file._filename || file.name;
    metadata.size = metadata.size || file.size || file.length;
    metadata.mimeType = metadata.mimeType || file.mimeType || file.type || 'application/octet-stream';

    if (options.public === true) {
      metadata._public = true;
    }

    const createConfig = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname
      }),
      properties: options.properties,
      timeout: options.timeout,
      data: metadata,
      client: this.client
    });
    createConfig.headers.set('X-Kinvey-Content-Type', metadata.mimeType);
    const createRequest = new NetworkRequest(createConfig);

    if (metadata[idAttribute]) {
      createRequest.method = RequestMethod.PUT;
      createRequest.url = url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/${metadata._id}`,
        query: options.query
      });
    }

    const createResponse = await createRequest.execute();
    const data = createResponse.data;
    const uploadUrl = data._uploadURL;
    const headers = data._requiredHeaders || {};
    headers['Content-Type'] = metadata.mimeType;
    headers['Content-Length'] = metadata.size;

    // Delete fields from the response
    delete data._expiresAt;
    delete data._requiredHeaders;
    delete data._uploadURL;

    // Upload the file
    const uploadConfig = new KinveyRequestConfig({
      method: RequestMethod.PUT,
      url: uploadUrl,
      data: file
    });
    uploadConfig.headers.clear();
    uploadConfig.headers.add(headers);
    const uploadRequest = new NetworkRequest(uploadConfig);
    await uploadRequest.execute();

    data._data = file;
    return data;
  }

  create(file, metadata, options) {
    return this.upload(file, metadata, options);
  }

  update(file, metadata, options) {
    return this.upload(file, metadata, options);
  }
}
