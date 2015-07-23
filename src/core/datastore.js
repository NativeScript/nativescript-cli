import defaults from 'lodash/object/defaults';
import Request from './request';
import HttpMethod from '../enums/httpMethod';
import AuthType from '../enums/authType';
import Kinvey from '../kinvey';
import User from './user';
import {isDefined} from '../utils';
const appDataPath = '/appdata';
const userPath = '/user';

function defaultOptions(options = {}) {
  return defaults(options, {
    authType: AuthType.Default
  });
}

function getPath(collection, id) {
  let path = '';

  // Namespace
  if (this instanceof User || this === User) {
    path = userPath;
  } else {
    path = appDataPath;
  }

  // App key
  path = `${path}/${Kinvey.appKey}}`;

  // Collection
  if (isDefined(collection)) {
    path = `${path}/${collection}`;
  }

  // Id
  if (isDefined(id)) {
    path = `${path}/${id}`;
  }

  return path;
}

class DataStore {
  static find(collection, query, options = {}) {
    const path = getPath.call(this, collection);
    options = defaultOptions(options);

    // Create a request
    const request = new Request(HttpMethod.GET, path, query, null, options);

    // Execute the request
    const promise = request.execute(options).then((response) => {
      return response.data;
    });

    // Return the promise
    return promise;
  }

  static create(collection, data, options = {}) {
    const path = getPath.call(this, collection);
    options = defaultOptions(options);

    // Create a request
    const request = new Request(HttpMethod.POST, path, null, data, options);

    // Execute the request
    const promise = request.execute(options).then((response) => {
      return response.data;
    });

    // Return the promise
    return promise;
  }

  update(collection, data, options = {}) {
    const path = getPath.call(this, collection);
    options = defaultOptions(options);

    // Create a request
    const request = new Request(HttpMethod.PUT, path, null, data, options);

    // Execute the request
    const promise = request.execute(options).then((response) => {
      return response.data;
    });

    // Return the promise
    return promise;
  }

  destroy(collection, id, options = {}) {
    const path = getPath.call(this, collection, id);
    options = defaultOptions(options);

    // Create a request
    const request = new Request(HttpMethod.DELETE, path, null, null, options);

    // Execute the request
    const promise = request.execute(options).then((response) => {
      return response.data;
    });

    // Return the promise
    return promise;
  }
}

export default DataStore;
