import Datastore from './datastore';
import Client from '../client';
import Request from '../request';
import { KinveyError } from '../errors';
import HttpMethod from '../enums/httpMethod';
import ResponseType from '../enums/responseType';
import DataPolicy from '../enums/dataPolicy';
import Auth from '../auth';
import url from 'url';
import when from 'when';
import assign from 'lodash/object/assign';
import isObject from 'lodash/lang/isObject';
const filesNamespace = 'blob';
const pathReplaceRegex = /[^\/]$/;

/**
 * The Files class is used to perform operations on files on the Kinvey platform.
 *
 * @example
 * var files = new Kinvey.Files();
 */
export default class Files extends Datastore {
  /**
   * Creates a new instance of the Files class.
   *
   * @param   {Client}    [client=Client.sharedInstance()]            Client
   */
  constructor(client = Client.sharedInstance()) {
    super(null, client);
  }

  /**
   * The path for the files where requests will be sent.
   *
   * @return   {string}    Path
   */
  get path() {
    return `/${filesNamespace}/${this.client.appKey}`;
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
    // Build flags
    options.flags = {};
    if (options.tls !== false) {
      options.flags.tls = true;
    }

    if (options.ttl) {
      options.flags.ttl_in_seconds = options.ttl;
    }

    // Execute the request
    const promise = super.find(query, options).then((files) => {
      // Download the file
      if (options.download) {
        const promises = files.map((file) => {
          return this.downloadByUrl(file, options);
        });

        return when.all(promises);
      }

      return files;
    });

    // Return the promise
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
    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Build flags
    options.flags = {};
    if (options.tls !== false) {
      options.flags.tls = true;
    }

    if (options.ttl) {
      options.flags.ttl_in_seconds = options.ttl;
    }

    // Create the request path
    const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent(name)}`;

    // Create and execute a request
    const request = new Request(HttpMethod.GET, path, null, null, options);
    const promise = request.execute().then((response) => {
      // Stream the file
      if (options.stream) {
        return response.data;
      }

      // Download the file
      return this.downloadByUrl(response.data, options);
    });

    // Return the promise
    return promise;
  }

  donwloadByUrl(metadataOrUrl) {
    let metadata = metadataOrUrl;

    // Format metadata
    if (!isObject(metadataOrUrl)) {
      metadata = {
        _downloadURL: metadataOrUrl
      };
    }

    // Create a client
    const sharedClient = Client.sharedInstance();
    const client = new Client({
      appKey: sharedClient.appKey,
      appSecret: sharedClient.appSecret,
      masterSecret: sharedClient.masterSecret,
      encryptionKey: sharedClient.encryptionKey,
      apiUrl: metadata._downloadURL,
      allowHttp: true
    });

    // Create the request path
    const path = url.parse(metadata._downloadURL).path;

    // Create and execute the request
    const request = new Request(HttpMethod.GET, path, null, null, {
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

    // Return the promise
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
    // Extract metadata
    data._filename = data._filename || file._filename || file.name;
    data.size = data.size || file.size || file.length;
    data.mimeType = data.mimeType || file.mimeType || file.type || 'application/octet-stream';

    if (options.public) {
      data._public = true;
    }

    // Request path
    let path = this.path;
    let request;

    if (data._id) {
      // Add the _id to the path
      path = `${path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent(data._id)}`;

      // Create the request
      request = new Request(HttpMethod.PUT, path, null, data, options);
    } else {
      // Create the request
      request = new Request(HttpMethod.POST, path, null, data, options);
    }

    // Execute the request
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
        appKey: sharedClient.appKey,
        appSecret: sharedClient.appSecret,
        masterSecret: sharedClient.masterSecret,
        encryptionKey: sharedClient.encryptionKey,
        apiUrl: uploadUrl,
        allowHttp: true
      });

      // Parse the path
      const path = url.parse(uploadUrl).path;

      // Upload the file
      const request = new Request(HttpMethod.PUT, path, null, file, {
        client: client
      });
      request.addHeaders(headers);
      request.removeHeader('X-Kinvey-Api-Version');
      return request.execute().then(() => {
        response._data = file;
        return response;
      });
    });

    // Return the promise
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
    // Execute the request
    const promise = super.destroy(name, options).catch((err) => {
      if (err.name === 'BLOB_NOT_FOUND') {
        return { count: 0 };
      }

      throw err;
    });

    // Return the promise
    return promise;
  }
}
