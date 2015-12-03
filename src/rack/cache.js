const Middleware = require('./middleware');
const Store = require('../core/store');
const HttpMethod = require('../core/enums').HttpMethod;
const StatusCode = require('../core/enums').StatusCode;
const StoreAdapter = require('../core/enums').StoreAdapter;

class Cache extends Middleware {
  constructor() {
    super('Kinvey Cache Middleware');
  }

  handle(request) {
    return super.handle(request).then(matches => {
      const method = request.method;
      const query = request.query;
      const appId = matches.appId;
      const collection = matches.collection;
      const id = matches.id;
      const data = request.data;
      const store = new Store(appId, [StoreAdapter.IndexedDB, StoreAdapter.WebSQL, StoreAdapter.LocalStorage, StoreAdapter.Memory]);
      let promise;

      if (method === HttpMethod.GET) {
        if (id) {
          if (id === '_count') {
            promise = store.count(collection, query);
          } else if (id === '_group') {
            promise = store.group(collection, data);
          } else {
            promise = store.get(collection, id);
          }
        } else {
          promise = store.find(collection, query);
        }
      } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
        promise = store.save(collection, data);
      } else if (method === HttpMethod.DELETE) {
        if (id) {
          promise = store.delete(collection, id);
        } else {
          promise = store.deleteWhere(collection, query);
        }
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
      });
    });
  }
}

module.exports = Cache;
