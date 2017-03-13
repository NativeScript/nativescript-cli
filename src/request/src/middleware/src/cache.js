import isEmpty from 'lodash/isEmpty';

import Middleware from './middleware';
import Storage from './storage';

export default class CacheMiddleware extends Middleware {
  constructor(name = 'Cache Middleware') {
    super(name);
  }

  loadStorage(name) {
    return new Storage(name);
  }

  handle(request) {
    const { method, body, appKey, collection, entityId } = request;
    const storage = this.loadStorage(appKey);
    let promise;

    if (method === 'GET') {
      if (entityId) {
        promise = storage.findById(collection, entityId);
      } else {
        promise = storage.find(collection);
      }
    } else if (method === 'POST' || method === 'PUT') {
      if (entityId === '_group') {
        promise = storage.find(collection);
      } else {
        promise = storage.save(collection, body);
      }
    } else if (method === 'DELETE') {
      if (collection && entityId) {
        promise = storage.removeById(collection, entityId);
      } else if (!collection) {
        promise = storage.clear();
      } else {
        promise = storage.remove(collection, body);
      }
    }

    return promise.then((data) => {
      const response = {
        statusCode: method === 'POST' ? 201 : 200,
        data: data
      };

      if (method === 'POST' && entityId === '_group') {
        response.statusCode = 200;
      }

      if (!data || isEmpty(data)) {
        response.statusCode = 204;
      }

      return response;
    })
    .catch(error => ({ statusCode: error.code || 500 }))
    .then(response => ({ response: response }));
  }
}
