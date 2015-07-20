import Middleware from './middleware';
<<<<<<< Updated upstream
import {isDefined} from '../core/utils';
=======
import {isDefined} from '../utils';
>>>>>>> Stashed changes
import isObject from 'lodash/lang/isObject';

class ParserMiddleware extends Middleware {
  constructor(name = 'Kinvey Parser Middleware') {
    super(name);
  }

  handle(request) {
    if (isObject(request)) {
<<<<<<< Updated upstream
      let response = request.response;

      if (isDefined(response) && isDefined(response.data)) {
        let contentType = response.getHeader('Content-Type');
=======
      const response = request.response;

      if (isDefined(response) && isDefined(response.data)) {
        const contentType = response.getHeader('Content-Type');
>>>>>>> Stashed changes

        if (contentType.indexOf('application/json') === 0) {
          try {
            response.data = JSON.parse(response.data);
          } catch (err) {
            response.data = response.data;
          }

          request.response = response;
        }
      }
    }

    return Promise.resolve(request);
  }
}

export default ParserMiddleware;
