import isEmpty from 'lodash/isEmpty';
import { isDefined } from '../../utils';
import { Middleware } from './middleware';
import { Storage } from './storage';

export class CacheMiddleware extends Middleware {
  constructor(name = 'Cache Middleware') {
    super(name);
  }

  loadStorage(name, storageProviders) {
    return new Storage(name, storageProviders);
  }

  handle(request) {
    const { method, body, appKey, collection, entityId, encryptionKey, storageProviders } = request;
    const storage = this.loadStorage(appKey, storageProviders, encryptionKey);
    let promise;

    if (method === 'GET') {
      if (isDefined(entityId)) {
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
      if (isDefined(collection) === false) {
        promise = storage.clear();
      } else {
        promise = storage.removeById(collection, entityId);
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

      if (isDefined(data) === false || isEmpty(data)) {
        response.statusCode = 204;
      }

      return response;
    })
    .catch(error => ({ statusCode: error.code }))
    .then(response => ({ response: response }));
  }
}
