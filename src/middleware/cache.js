import Middleware from './middleware';
import HttpMethod from '../enums/httpMethod';

class CacheMiddleware extends Middleware {
  constructor() {
    super('Kinvey Cache Middleware');
  }

  handle(request) {
    if (request.method === HttpMethod.GET) {
      request.response = request.cachedResponse;
    }
    else if (request.method === HttpMethod.DELETE) {
      request.clearCache();
    }
    else {
      request.cache();
    }

    return Promise.resolve(request);
  }
}

export default CacheMiddleware;
