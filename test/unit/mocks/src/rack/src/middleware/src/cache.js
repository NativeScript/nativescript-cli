import Middleware from 'kinvey-javascript-rack';
import { NotFoundError } from './errors';
import Storage from './storage';
import isEmpty from 'lodash/isEmpty';

export default class CacheMiddleware extends Middleware {
  constructor(name = 'Cache Middleware') {
    super(name);
  }

  handle(request) {
    const { method, body, appKey, collection, entityId } = request;
    const storage = new Storage(appKey);
    const response = {
      statusCode: method === 'POST' ? 201 : 200,
      headers: {},
      data: undefined
    };
    let promise;

    if (method === 'GET') {
      if (entityId) {
        promise = storage.findById(collection, entityId);
      } else {
        promise = storage.find(collection);
      }
    } else if (method === 'POST' || method === 'PUT') {
      promise = storage.save(collection, body);
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
      response.data = data;

      if (!data || isEmpty(data)) {
        response.statusCode = 204;
      }

      return response;
    }).catch((error) => {
      if (error instanceof NotFoundError) {
        response.statusCode = 404;
      } else {
        response.statusCode = 500;
      }

      return response;
    }).then((response) => {
      return { response: response };
    });
  }
}
