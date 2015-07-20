import Middleware from './middleware';
import {isDefined} from '../utils';
import isObject from 'lodash/lang/isObject';

class ParserMiddleware extends Middleware {
  constructor(name = 'Kinvey Parser Middleware') {
    super(name);
  }

  handle(request) {
    if (isObject(request)) {
      const response = request.response;

      if (isDefined(response) && isDefined(response.data)) {
        const contentType = response.getHeader('Content-Type');

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
