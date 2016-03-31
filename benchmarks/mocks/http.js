import { KinveyMiddleware } from '../../src/rack/middleware';
import fetch from 'node-fetch';

export class HttpMiddleware extends KinveyMiddleware {
  constructor(name = 'Test Http Middleware') {
    super(name);
  }

  handle(request) {
    return super.handle(request).then(() => {
      return fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.data,
        redirect: request.followRedirect === false ? 0 : request.followRedirect,
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
