import Middleware from './middleware';
import HttpMethod from '../enums/httpMethod';
import Cache from '../core/cache';
import log from '../core/logger';
import utils from '../core/utils';
import Response from '../core/response';

class CacheMiddleware extends Middleware {
  constructor() {
    super('Kinvey Cache Middleware');
  }

  handle(request) {
    let key = request.cacheKey;
    log.info(`Cache key: ${key}`);

    if (request.method === HttpMethod.GET) {
      let cachedResponse = Cache.get(key);

      if (utils.isDefined(cachedResponse)) {
        request.response = new Response(cachedResponse.statusCode, cachedResponse.headers, cachedResponse.data);
      }
    } else if (request.method === HttpMethod.DELETE) {
      Cache.del(key);
    } else {
      let data = utils.isDefined(request.response) ? request.response.toJSON() : null;
      log.info(`Set cache data: ${data}`);
      Cache.set(key, data);
    }

    return Promise.resolve(request);
  }
}

export default CacheMiddleware;
