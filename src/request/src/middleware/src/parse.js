import Promise from 'es6-promise';

import { isDefined } from 'src/utils';
import Middleware from './middleware';

export default class ParseMiddleware extends Middleware {
  constructor(name = 'Parse Middleware') {
    super(name);
  }

  handle(request, response) {
    if (isDefined(response) && isDefined(response.data)) {
      const contentType = response.headers['content-type'] || response.headers['Content-Type'];

      if (contentType) {
        if (contentType.indexOf('application/json') === 0) {
          try {
            response.data = JSON.parse(response.data);
          } catch (error) {
            // Just catch the error
          }
        }
      }
    }

    return Promise.resolve({ response: response });
  }
}
