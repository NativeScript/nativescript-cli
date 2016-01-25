import Auth from '../auth';
import Model from './model';
import Query from '../query';
import { KinveyError } from '../errors';
import { HttpMethod, ReadPolicy as DataPolicy } from '../enums';
import assign from 'lodash/object/assign';
const filesNamespace = process.env.KINVEY_FILE_NAMESPACE || 'blob';

export default class File extends Model {
  find(query, options = {}) {
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('query argument must be an instance of Kinvey.Query'));
    }

    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.GET;
    options.pathname = `/${filesNamespace}/${this.client.appId}`;
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
    options.pathname = `/${filesNamespace}/${this.client.appId}/${name}`;
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
    options.pathname = `/${filesNamespace}/${this.client.appId}/${name}`;

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
