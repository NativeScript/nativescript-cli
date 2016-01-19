const Middleware = require('./middleware');
const Cache = require('../cache');
const HttpMethod = require('../enums').HttpMethod;
const StatusCode = require('../enums').StatusCode;
const CacheAdapter = require('../enums').CacheAdapter;
const defaultAdapters = [CacheAdapter.IndexedDB, CacheAdapter.WebSQL, CacheAdapter.LocalStorage, CacheAdapter.Memory];

class CacheMiddleware extends Middleware {
  constructor(adapters = defaultAdapters) {
    super('Kinvey Cache Middleware');
    this.adapters = adapters;
  }

  handle(request) {
    return super.handle(request).then(matches => {
      const method = request.method;
      const query = request.query;
      const appId = matches.appId;
      const collection = matches.collection;
      const id = matches.id;
      const data = request.data;
      const cache = new Cache(appId, this.adapters);
      let promise;

      if (method === HttpMethod.GET) {
        if (id) {
          if (id === '_count') {
            promise = cache.count(collection, query);
          } else if (id === '_group') {
            promise = cache.group(collection, data);
          } else {
            promise = cache.get(collection, id);
          }
        } else {
          promise = cache.find(collection, query);
        }
      } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
        promise = cache.save(collection, data);
      } else if (method === HttpMethod.DELETE) {
        if (id) {
          promise = cache.remove(collection, id);
        } else {
          promise = cache.removeWhere(collection, query);
        }
      }

      return promise.then(result => {
        let statusCode = StatusCode.Ok;

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

module.exports = CacheMiddleware;
