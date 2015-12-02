const Auth = require('../auth');
const DataPolicy = require('../enums').DataPolicy;
const Model = require('./model');
const Query = require('../query');
const KinveyError = require('../errors').KinveyError;
const HttpMethod = require('../enums').HttpMethod;
const assign = require('lodash/object/assign');
const filesNamespace = process.env.KINVEY_FILE_NAMESPACE || 'blob';

class File extends Model {
  find(query, options = {}) {
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('query argument must be an instance of Kinvey.Query'));
    }

    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.GET;
    options.path = `/${filesNamespace}/${this.client.appId}`;
    options.query = query;
    options.flags = {};

    if (options.tls !== false) {
      options.flags.tls = true;
    }

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers

    if (options.ttl) {
      options.flags.ttl_in_seconds = options.ttl;
    }

    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    const request = new Request(options);
    const promise = request.execute().then((response) => {
      if (options.download) {
        const promises = response.map((file) => {
          return this.downloadByUrl(file, options);
        });
        return Promise.all(promises);
      }

      return response;
    });

    return promise;
  }

  download(name, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.GET;
    options.path = `/${filesNamespace}/${this.client.appId}/${name}`;
    options.flags = {};

    if (options.tls !== false) {
      options.flags.tls = true;
    }

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers

    if (options.ttl) {
      options.flags.ttl_in_seconds = options.ttl;
    }

    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    const request = new Request(options);
    const promise = request.execute().then((response) => {
      if (options.stream) {
        return response;
      }

      return this.downloadByUrl(response, options);
    });

    return promise;
  }

  downloadByUrl() {
    // TODO
    throw new KinveyError('Method not supported');
  }

  stream(name, options = {}) {
    options.stream = true;
    return this.download(name, options);
  }

  upload() {
    // TODO
    throw new KinveyError('Method not supported');
  }

  destroy(name, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.DELETE;
    options.path = `/${filesNamespace}/${this.client.appId}/${name}`;

    const request = new Request(options);
    const promise = request.execute().catch((err) => {
      if (options.silent && err.name === 'BLOB_NOT_FOUND') {
        return { count: 0 };
      }

      return Promise.reject(err);
    });

    return promise;
  }
}

module.exports = File;
