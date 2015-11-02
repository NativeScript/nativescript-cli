// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
const Datastore = require('./datastore');
const Client = require('../client');
const Request = require('../request').Request;
const KinveyError = require('../errors').KinveyError;
const HttpMethod = require('../enums/httpMethod');
const ResponseType = require('../enums/responseType');
const DataPolicy = require('../enums/dataPolicy');
const Auth = require('../auth');
const File = require('../models/file');
const url = require('url');
const Promise = require('bluebird');
const assign = require('lodash/object/assign');
const defaults = require('lodash/object/defaults');
const isObject = require('lodash/lang/isObject');
const filesNamespace = process.env.KINVEY_FILES_NAMESPACE || 'blob';
const pathReplaceRegex = /[^\/]$/;

/**
 * The Files class is used to perform operations on files on the Kinvey platform.
 *
 * @example
 * var files = new Kinvey.Files();
 */
class Files extends Datastore {
  /**
   * Creates a new instance of the Files class.
   *
   * @param   {Client}    [client=Client.sharedInstance()]            Client
   */
  constructor(client = Client.sharedInstance(), options = {}) {
    options.model = File;
    super('files', client, options);
  }

  /**
   * The path for the files where requests will be sent.
   *
   * @return   {string}    Path
   */
  get path() {
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
   * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.CloudFirst]    Data policy
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
    options.flags = {};

    if (options.tls !== false) {
      options.flags.tls = true;
    }

    if (options.ttl) {
      options.flags.ttl_in_seconds = options.ttl;
    }

    const promise = super.find(query, options).then((files) => {
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
   * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.CloudFirst]    Data policy
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
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.GET;
    options.path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent(name)}`;
    options.flags = {};

    if (options.tls !== false) {
      options.flags.tls = true;
    }

    if (options.ttl) {
      options.flags.ttl_in_seconds = options.ttl;
    }

    const request = new Request(options);
    const promise = request.execute().then((response) => {
      if (options.stream) {
        return response.data;
      }

      return this.downloadByUrl(response.data, options);
    });

    return promise;
  }

  donwloadByUrl(metadataOrUrl) {
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
      path: url.parse(metadata._downloadURL).path,
      client: client
    });
    request.setHeader('Accept', metadata.mimeType || 'application-octet-stream');
    request.removeHeader('Content-Type');
    request.removeHeader('X-Kinvey-Api-Version');
    request.setResponseType = ResponseType.Blob;

    const promise = request.execute().then((data) => {
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
   * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.CloudFirst]    Data policy
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

  upload(file = {}, data = {}, options = {}) {
    data._filename = data._filename || file._filename || file.name;
    data.size = data.size || file.size || file.length;
    data.mimeType = data.mimeType || file.mimeType || file.type || 'application/octet-stream';

    if (options.public) {
      data._public = true;
    }

    if (data._id) {
      options = defaults({
        method: HttpMethod.PUT,
        path: `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent(data._id)}`,
        data: data
      }, options);
    } else {
      options = defaults({
        method: HttpMethod.POST,
        path: this.path,
        data: data
      }, options);
    }

    const request = new Request(options);
    request.setHeader('Content-Type', data.mimeType);

    const promise = request.execute().then((response) => {
      const uploadUrl = response._uploadURL;
      const headers = response._requiredHeaders || {};
      headers['Content-Type'] = data.mimeType;

      // Delete fields from the response
      delete response._expiresAt;
      delete response._requiredHeaders;
      delete response._uploadURL;

      // Create a client
      const sharedClient = Client.sharedInstance();
      const client = new Client({
        appId: sharedClient.appId,
        appSecret: sharedClient.appSecret,
        masterSecret: sharedClient.masterSecret,
        encryptionKey: sharedClient.encryptionKey,
        apiUrl: uploadUrl,
        allowHttp: true
      });

      // Parse the path
      const path = url.parse(uploadUrl).path;

      // Upload the file
      const uploadRequest = new Request({
        method: HttpMethod.PUT,
        path: path,
        data: file,
        client: client
      });
      uploadRequest.addHeaders(headers);
      uploadRequest.removeHeader('X-Kinvey-Api-Version');

      return uploadRequest.execute().then(() => {
        response._data = file;
        return response;
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
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var files = new Kinvey.Files();
   * files.destroy('BostonTeaParty.png').then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  destroy(name, options = {}) {
    const promise = super.destroy(name, options).catch((err) => {
      if (err.name === 'BLOB_NOT_FOUND') {
        return { count: 0 };
      }

      throw err;
    });

    return promise;
  }
}

module.exports = Files;
