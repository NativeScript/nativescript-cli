import Middleware from './middleware';
import LocalStorage from '../core/storage/local';
import HttpMethod from '../core/enums/httpMethod';
import StatusCode from '../core/enums/statusCode';

export default class StorageMiddleware extends Middleware {
  constructor() {
    super('Kinvey Storage Middleware');
  }

  handle(request) {
    return super.handle(request).then((matches) => {
      const method = request.method;
      const query = request.query;
      const collection = matches.collection;
      const id = matches.id;
      const store = new LocalStorage({
        collection: collection
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

      return promise.then((result) => {
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
      }).catch((err) => {
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
