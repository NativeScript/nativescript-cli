import Middleware from './middleware';
import {isDefined} from '../core/utils';

class SerializerMiddleware extends Middleware {
  constructor() {
    super('Kinvey Serializer Middleware');
  }

  handle(request) {
    if (isDefined(request.body)) {
      let contentType = request.getHeader('content-type');

      if (contentType.indexOf('application/json') === 0) {
        request.body = JSON.stringify(request.body);
      }
    }

    return Promise.resolve(request);
  }
}

export default SerializerMiddleware;
