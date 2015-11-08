const Middleware = require('./middleware');
const Store = require('../../core/store');
const HttpMethod = require('../../core/enums/httpMethod');
const StatusCode = require('../../core/enums/statusCode');
const StoreAdapter = require('../../core/enums/storeAdapter');

class Cache extends Middleware {
  constructor() {
    super('Kinvey Cache Middleware');
  }

  handle(request) {
    return super.handle(request).then((matches) => {
      const method = request.method;
      const query = request.query;
      const id = matches.id;
      const store = new Store(`${matches.appId}.${matches.collection}`, [StoreAdapter.IndexedDB, StoreAdapter.WebSQL, StoreAdapter.Memory]);
      let promise;

      if (method === HttpMethod.GET) {
        if (id) {
          promise = store.get(id);
        } else {
          promise = store.find(query);
        }
      } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
        promise = store.save(request.data);
      } else if (method === HttpMethod.DELETE) {
        promise = store.remove(id);
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
