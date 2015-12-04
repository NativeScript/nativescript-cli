const Collection = require('./collection');
const Client = require('../client');
const Request = require('../request').Request;
const KinveyError = require('../errors').KinveyError;
const BlobNotFoundError = require('../errors').BlobNotFoundError;
const HttpMethod = require('../enums').HttpMethod;
const ResponseType = require('../enums').ResponseType;
const DataPolicy = require('../enums').DataPolicy;
const Auth = require('../auth');
const File = require('../models/file');
const url = require('url');
const log = require('loglevel');
const Promise = require('bluebird');
const assign = require('lodash/object/assign');
const isObject = require('lodash/lang/isObject');
const filesNamespace = process.env.KINVEY_FILES_NAMESPACE || 'blob';

/**
 * The Files class is used to perform operations on files on the Kinvey platform.
 *
 * @example
 * var files = new Kinvey.Files();
 */
class Files extends Collection {
  /**
   * Creates a new instance of the Files class.
   *
   * @param   {Client}    [client=Client.sharedInstance()]            Client
   */
  constructor(options = {}) {
    options.model = File;
    super('files', options);
  }

  /**
   * The pathname for the collection where requests will be sent.
   *
   * @param  {Client}  Client
   * @return {string}  Path
   */
  getPathname(client) {
    client = client || this.client;
    return `/${filesNamespace}/${this.client.appId}`;
  }

  /**
   * Find all files. A query can be optionally provided to return a
   * subset of all the files for your application. The number of files returned will adhere
   * to the limits specified at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   * A promise will be returned that will be resolved with the files or rejected with
   * an error.
   *
   * @param   {Query}         [query]                                       Query
   * @param   {Object}        [options]                                     Options
   * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
   * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
   * @param   {Boolean}       [options.download]                            Download the files
   * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
   * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
   * @return  {Promise}                                                     Promise
   *
   * @example
   * var files = new Kinvey.Files();
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
    options = assign({
      download: false,
      tls: false,
      ttl: undefined,
      search: {}
    }, options);
    options.dataPolicy = DataPolicy.NetworkOnly;

    if (options.tls !== false) {
      options.search.tls = true;
    }

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers

    if (options.ttl) {
      options.search.ttl_in_seconds = options.ttl;
    }

    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    const promise = super.find(query, options).then(files => {
      if (options.download) {
        const promises = files.map((file) => {
          return this.downloadByUrl(file, options);
        });

        return Promise.all(promises);
      }

      return files;
    });
    return promise;
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
  download(name, options = {}) {
    options = assign({
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.dataPolicy = DataPolicy.NetworkOnly;
    options.method = HttpMethod.GET;
    options.pathname = `${this.getPathname(options.client)}/${name}`;
    options.search = {};

    if (options.tls !== false) {
      options.search.tls = true;
    }

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers

    if (options.ttl) {
      options.search.ttl_in_seconds = options.ttl;
    }

    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    const request = new Request(options);
    const promise = request.execute().then(response => {
      if (options.stream) {
        log.info('Returning the file only because of the stream flag.');
        return new this.model(response.data, options); // eslint-disable-line new-cap
      }

      // return this.downloadByUrl(response.data, options);
      return new this.model(response.data, options);
    });

    return promise;
  }

  downloadByUrl(metadataOrUrl) {
    let metadata = metadataOrUrl;

    if (!isObject(metadataOrUrl)) {
      metadata = {
        _downloadURL: metadataOrUrl
      };
    }

    const sharedClient = Client.sharedInstance();
    const client = new Client({
      appId: sharedClient.appId,
      appSecret: sharedClient.appSecret,
      masterSecret: sharedClient.masterSecret,
      encryptionKey: sharedClient.encryptionKey,
      apiUrl: metadata._downloadURL,
      allowHttp: true
    });

    const request = new Request({
      method: HttpMethod.GET,
      pathname: url.parse(metadata._downloadURL).path,
      client: client
    });
    request.setHeader('Accept', metadata.mimeType || 'application-octet-stream');
    request.removeHeader('Content-Type');
    request.removeHeader('X-Kinvey-Api-Version');
    request.setResponseType = ResponseType.Blob;

    const promise = request.execute().then(data => {
      metadata._data = data;
      return metadata;
    }).catch((err) => {
      throw new KinveyError('The file could not be downloaded from the provided url.', err);
    });

    return promise;
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

  upload(file, metadata = {}, options = {}) {
    metadata = metadata || {};
    metadata._filename = metadata._filename || file._filename || file.name;
    metadata.size = metadata.size || file.size || file.length;
    metadata.mimeType = metadata.mimeType || file.mimeType || file.type || 'application/octet-stream';

    options = assign({
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync,
      public: false,
      contentType: metadata.mimeType
    }, options);
    options.dataPolicy = DataPolicy.NetworkOnly;

    if (options.public) {
      metadata._public = true;
    }

    if (metadata._id) {
      options.method = HttpMethod.PUT;
      options.pathname = `${this.getPathname(options.client)}/${metadata._id}`;
    } else {
      options.method = HttpMethod.POST;
      options.pathname = this.getPathname(options.client);
    }

    options.data = metadata;
    const request = new Request(options);

    const promise = request.execute().then(response => {
      const uploadUrl = response.data._uploadURL;
      const uploadUrlParts = url.parse(uploadUrl);
      const headers = response.data._requiredHeaders || {};
      headers['Content-Type'] = metadata.mimeType;
      headers['Content-Length'] = metadata.size;

      // Delete fields from the response
      delete response.data._expiresAt;
      delete response.data._requiredHeaders;
      delete response.data._uploadURL;

      // Create a client
      const client = new Client({
        appId: options.client.appId,
        appSecret: options.client.appSecret,
        masterSecret: options.client.masterSecret,
        encryptionKey: options.client.encryptionKey,
        apiUrl: uploadUrl,
        allowHttp: true
      });

      // Upload the file
      const uploadRequest = new Request({
        dataPolicy: DataPolicy.NetworkOnly,
        auth: Auth.none,
        method: HttpMethod.PUT,
        pathname: uploadUrlParts.pathname,
        search: uploadUrlParts.query,
        data: file,
        client: client
      });
      uploadRequest.clearHeaders();
      uploadRequest.addHeaders(headers);

      return uploadRequest.execute().then(() => {
        response.data._data = file;
        return new this.model(response.data, options); // eslint-disable-line new-cap
      });
    });

    return promise;
  }

  /**
   * Delete a file. A promise will be returned that will be resolved with a count
   * of the number of files deleted or rejected with an error.
   *
   * @param   {string}       name                                         File name
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.NetworkFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var files = new Kinvey.Files();
   * files.delete('BostonTeaParty.png').then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  delete(name, options = {}) {
    const promise = super.delete(name, options).catch((err) => {
      if (options.silent && err instanceof BlobNotFoundError) {
        return { count: 0 };
      }

      throw err;
    });

    return promise;
  }
}

module.exports = Files;
