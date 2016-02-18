import NetworkStore from './networkStore';
import NetworkRequest from '../requests/networkRequest';
import { HttpMethod } from '../enums';
import { KinveyError } from '../errors';
import assign from 'lodash/assign';
import map from 'lodash/map';
const filesNamespace = process.env.KINVEY_FILES_NAMESPACE || 'blob';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The FilesStore class is used to find, save, update, remove, count and group files.
 */
export default class FilesStore extends NetworkStore {
  /**
   * The pathname for the store.
   *
   * @return  {string}                Pathname
   */
  get _pathname() {
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
  find(query, options = {}) {
    options = assign({
      download: false,
      tls: false
    }, options);

    options.flags = {
      tls: options.tls === true ? true : false,
      ttl_in_seconds: options.ttl
    };

    const promise = super.find(query, options).then(files => {
      if (options.download === true) {
        const promises = map(files, file => {
          return this.downloadByUrl(file._downloadURL, options);
        });
        return Promise.all(promises);
      }

      return files;
    });

    return promise;
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
  download(name, options = {}) {
    options = assign({
      stream: false,
      tls: false
    }, options);

    options.flags = {
      tls: options.tls === true ? true : false,
      ttl_in_seconds: options.ttl
    };

    const promise = super.findById(name, options).then(file => {
      if (options.stream === true) {
        return file;
      }

      return this.downloadByUrl(file._downloadURL, options);
    });

    return promise;
  }

  downloadByUrl(url, options = {}) {
    const promise = Promise.resolve().then(() => {
      const request = new NetworkRequest({
        method: HttpMethod.GET,
        url: url,
        timeout: options.timeout
      });
      request.setHeader('Accept', options.mimeType || 'application-octet-stream');
      request.removeHeader('Content-Type');
      request.removeHeader('X-Kinvey-Api-Version');
      return request.execute();
    }).then(response => {
      return response.data;
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
    metadata._filename = metadata._filename || file._filename || file.name;
    metadata.size = metadata.size || file.size || file.length;
    metadata.mimeType = metadata.mimeType || file.mimeType || file.type || 'application/octet-stream';

    options = assign({
      properties: null,
      timeout: undefined,
      public: false,
      handler() {}
    }, options);

    if (options.public) {
      metadata._public = true;
    }

    const promise = Promise.resolve().then(() => {
      const requestOptions = {
        headers: {
          'X-Kinvey-Content-Type': metadata.mimeType
        },
        properties: options.properties,
        auth: this.client.defaultAuth(),
        timeout: options.timeout,
        data: metadata
      };

      if (metadata[idAttribute]) {
        requestOptions.method = HttpMethod.PUT;
        requestOptions.pathname = `${this._pathname}/${metadata._id}`;
      } else {
        requestOptions.method = HttpMethod.POST;
        requestOptions.pathname = this._pathname;
      }

      return this.client.executeNetworkRequest(requestOptions);
    }).then(response => {
      const uploadUrl = response.data._uploadURL;
      const headers = response.data._requiredHeaders || {};
      headers['Content-Type'] = metadata.mimeType;
      headers['Content-Length'] = metadata.size;

      // Delete fields from the response
      delete response.data._expiresAt;
      delete response.data._requiredHeaders;
      delete response.data._uploadURL;

      // Upload the file
      const request = new NetworkRequest({
        method: HttpMethod.PUT,
        url: uploadUrl,
        data: file
      });
      request.clearHeaders();
      request.addHeaders(headers);

      return request.execute().then(uploadResponse => {
        if (uploadResponse.isSuccess()) {
          response.data._data = file;
          return response.data;
        }

        throw uploadResponse.error;
      });
    });

    return promise;
  }

  save() {
    return Promise.reject(new KinveyError('Please use `upload()` to save files.'));
  }

  update() {
    return Promise.reject(new KinveyError('Please use `upload()` to update files.'));
  }
}
