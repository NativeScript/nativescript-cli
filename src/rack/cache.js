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
      const store = new Store(appId, [StoreAdapter.IndexedDB, StoreAdapter.LocalStorage, StoreAdapter.Memory]);
      let promise;

      if (method === HttpMethod.GET) {
        if (id) {
          if (id === '_count') {
            promise = store.count(collection);
          } else if (id === '_group') {
            promise = store.group(collection);
          } else {
            promise = store.get(collection, id);
          }
        } else {
          promise = store.find(collection, query);
        }
      } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
        promise = store.save(collection, request.data).then(result => {
          return store.saveDatabase().then(() => {
            return result;
          });
        });
      } else if (method === HttpMethod.DELETE) {
        promise = store.remove(collection, id).then(result => {
          return store.saveDatabase().then(() => {
            return result;
          });
        });
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

module.exports = Cache;
