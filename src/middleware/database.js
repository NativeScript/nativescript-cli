import Middleware from './middleware';
import Database from '../core/database';
import HttpMethod from '../enums/httpMethod';
import StatusCode from '../enums/statusCode';
import Response from '../core/response';

class DatabaseMiddleware extends Middleware {
  constructor() {
    super('Kinvey Database Middleware');
  }

  handle(request) {
    return super.handle(request).then(({ namespace, appKey, collection, id }) => {
      const database = new Database(`${namespace}.${appKey}`);
      const method = request.method;
      let promise;

      if (method === HttpMethod.GET) {
        if (id) {
          promise = database.get(collection, id);
        } else {
          promise = database.fetch(collection);
        }
      } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
        promise = database.save(collection, request.body);
      } else if (method === HttpMethod.DELETE) {
        promise = database.destroy(collection, id);
      }

      return promise.then((result) => {
        let statusCode = StatusCode.OK;

        if (method === HttpMethod.POST) {
          statusCode = StatusCode.Created;
        }

        request.response = new Response(statusCode, undefined, result);
        return request;
      }).catch((err) => {
        request.response = new Response(StatusCode.ServerError, err);
        return request;
      });
    });
  }
}

export default DatabaseMiddleware;
