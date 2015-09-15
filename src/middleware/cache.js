import Middleware from './middleware';
import HttpMethod from '../core/enums/httpMethod';
import StatusCode from '../core/enums/statusCode';
import Cache from '../core/cache';
import Response from '../core/response';

class CacheMiddleware extends Middleware {
  constructor() {
    super('Kinvey Cache Middleware');
  }

  handle(request) {
    if (request) {
      const cache = Cache.sharedInstance();
      const key = request.cacheKey;
      let response;

      if (request.method === HttpMethod.GET) {
        const cachedData = cache.get(key);

        if (cachedData) {
          response = new Response(StatusCode.OK, undefined, cachedData);
        } else {
          response = new Response(StatusCode.NotFound);
        }
      } else if (request.method === HttpMethod.DELETE) {
        cache.destroy(key);
        response = new Response(StatusCode.NoContent);
      } else {
        if (cache.set(key, request.body, request.cacheTime)) {
          response = new Response(StatusCode.OK, undefined, request.body);
        } else {
          response = new Response(StatusCode.ServerError);
        }
      }

      request.response = response;
    }

    return Promise.resolve(request);
  }
}

export default CacheMiddleware;
