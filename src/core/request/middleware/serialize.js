import Promise from 'es6-promise';
import { isDefined } from '../../utils';
import { Middleware } from './middleware';

export class SerializeMiddleware extends Middleware {
  constructor(name = 'Serialize Middleware') {
    super(name);
  }

  handle(request) {
    if (isDefined(request) && isDefined(request.body)) {
      const contentType = request.headers['content-type'] || request.headers['Content-Type'];

      if (isDefined(contentType)) {
        if (contentType.indexOf('application/json') === 0) {
          request.body = JSON.stringify(request.body);
        } else if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
          const body = request.body;
          const str = [];

          Object.keys(body).forEach((key) => {
            str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(body[key])}`);
          });

          request.body = str.join('&');
        }
      }
    }

    return Promise.resolve({ request: request });
  }
}
