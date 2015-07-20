import Middleware from './middleware';
import HttpMethod from '../enums/httpMethod';
import StatusCode from '../enums/statusCode';
<<<<<<< Updated upstream
import CacheManager from '../core/cacheManager';
import {isDefined} from '../core/utils';
=======
import Cache from '../core/cache';
import {isDefined} from '../utils';
>>>>>>> Stashed changes
import isFunction from 'lodash/lang/isFunction';
import Response from '../core/response';

class CacheMiddleware extends Middleware {
  constructor() {
    super('Kinvey Cache Middleware');
  }

  handle(request) {
    if (isDefined(request)) {
<<<<<<< Updated upstream
      let cache = CacheManager.instance();
      let key = request.cacheKey;
      let response;

      if (request.method === HttpMethod.GET) {
        let cachedResponse = cache.get(key);

        if (isDefined(cachedResponse)) {
          response = new Response(cachedResponse.statusCode, cachedResponse.headers, cachedResponse.data);
        }
        else {
          response = new Response(StatusCode.NotFound);
        }
      }
      else if (request.method === HttpMethod.DELETE) {
        cache.del(key);
        response = new Response(StatusCode.NoContent);
      }
      else {
        let data = isDefined(request.response) && isFunction(request.response.toJSON) ? request.response.toJSON() : request.response;
=======
      const cache = Cache.instance();
      const key = request.cacheKey;
      let response;

      if (request.method === HttpMethod.GET) {
        const cachedResponse = cache.get(key);

        if (isDefined(cachedResponse)) {
          response = new Response(cachedResponse.statusCode, cachedResponse.headers, cachedResponse.data);
        } else {
          response = new Response(StatusCode.NotFound);
        }
      } else if (request.method === HttpMethod.DELETE) {
        cache.del(key);
        response = new Response(StatusCode.NoContent);
      } else {
        const data = isDefined(request.response) && isFunction(request.response.toJSON) ? request.response.toJSON() : request.response;
>>>>>>> Stashed changes
        cache.set(key, data);
        response = request.response;
      }

      request.response = response;
    }

    return Promise.resolve(request);
  }
}

export default CacheMiddleware;
