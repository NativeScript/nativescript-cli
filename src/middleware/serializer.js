import Middleware from './middleware';
<<<<<<< Updated upstream
import {isDefined} from '../core/utils';
=======
import {isDefined} from '../utils';
>>>>>>> Stashed changes

class SerializerMiddleware extends Middleware {
  constructor() {
    super('Kinvey Serializer Middleware');
  }

  handle(request) {
    if (isDefined(request.body)) {
<<<<<<< Updated upstream
      let contentType = request.getHeader('content-type');
=======
      const contentType = request.getHeader('content-type');
>>>>>>> Stashed changes

      if (contentType.indexOf('application/json') === 0) {
        request.body = JSON.stringify(request.body);
      }
    }

    return Promise.resolve(request);
  }
}

export default SerializerMiddleware;
