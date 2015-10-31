import Auth from '../auth';
import DataPolicy from '../enums/dataPolicy';
import Model from './model';
import Query from '../query';
import { KinveyError } from '../errors';
import HttpMethod from '../enums/httpMethod';
import assign from 'lodash/object/assign';
const filesNamespace = 'blob';

export default class File extends Model {
  find(query, options = {}) {
    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('query argument must be an instance of Kinvey.Query'));
    }

    // Default options
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

    // Build the request path
    const path = `/${filesNamespace}/${this.client.appId}`;

    // Create and send the request
    const request = new Request(HttpMethod.GET, path, query, null, options);
    const promise = request.execute().then((response) => {
      // Download the file
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
    // Default options
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

    // Build the request path
    const path = `/${filesNamespace}/${this.client.appId}/${name}`;

    // Create and send the request
    const request = new Request(HttpMethod.GET, path, null, null, options);
    const promise = request.execute().then((response) => {
      if (options.stream) {
        return response;
      }

      return this.downloadByUrl(response, options);
    });

    return promise;
  }

  downloadByUrl() {
    // TO DO
  }

  stream(name, options = {}) {
    options.stream = true;
    return this.download(name, options);
  }

  upload() {
    // TO DO
  }

  destroy(name, options = {}) {
    // Default options
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Build the request path
    const path = `/${filesNamespace}/${this.client.appId}/${name}`;

    // Create and send the request
    const request = new Request(HttpMethod.DELETE, path, null, null, options);
    const promise = request.execute().catch((err) => {
      if (options.silent && err.name === 'BLOB_NOT_FOUND') {
        return { count: 0 };
      }

      return Promise.reject(err);
    });

    return promise;
  }
}
