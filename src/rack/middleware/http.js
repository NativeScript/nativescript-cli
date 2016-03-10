require('isomorphic-fetch');
import { KinveyMiddleware } from '../middleware';

/**
 * @private
 */
export class HttpMiddleware extends KinveyMiddleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    return super.handle(request).then(() => {
      return global.fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.data,
        redirect: request.redirect === true ? 0 : request.redirect,
        timeout: request.timeout
      }).then(fetchResponse => {
        return fetchResponse.text().then(data => {
          const response = {
            statusCode: fetchResponse.status,
            headers: {},
            data: data
          };

          response.headers['Content-Type'] = fetchResponse.headers.get('Content-Type');
          request.response = response;
          return request;
        });
      });
    });
  }
}
