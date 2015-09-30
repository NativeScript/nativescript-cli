import Middleware from './middleware';
import Store from '../../core/cache/store';
import HttpMethod from '../../core/enums/httpMethod';
import StatusCode from '../../core/enums/statusCode';
import StoreAdapter from '../../core/enums/storeAdapter';

export default class CacheMiddleware extends Middleware {
  constructor() {
    super('Kinvey Cache Middleware');
  }

  handle(request) {
    return super.handle(request).then((matches) => {
      const method = request.method;
      const query = request.query;
      const id = matches.id;
      const store = new Store([StoreAdapter.IndexedDB, StoreAdapter.WebSQL, StoreAdapter.LocalStorage, StoreAdapter.Memory], {
        name: matches.appKey,
        collection: matches.collection
      });
      let promise;

      if (method === HttpMethod.GET) {
        if (id) {
          promise = store.get(id);
        } else {
          promise = store.find(query);
        }
      } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
        promise = store.save(request.body);
      } else if (method === HttpMethod.DELETE) {
        promise = store.destroy(id);
      }

      return promise.then(result => {
        let statusCode = StatusCode.OK;

        if (method === HttpMethod.POST) {
          statusCode = StatusCode.Created;
        }

        request.response = {
          statusCode: statusCode,
          headers: {},
          data: result
        };

        return request;
      }).catch(err => {
        request.response = {
          statusCode: StatusCode.ServerError,
          headers: {},
          data: err
        };

        return request;
      });
    });
  }
}
