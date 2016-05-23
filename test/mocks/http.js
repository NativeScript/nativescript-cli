import { KinveyMiddleware } from '../../src/rack/middleware';
import http from 'request';

export class TestHttpMiddleware extends KinveyMiddleware {
  constructor(name = 'Kinvey Node Http Middleware') {
    super(name);
  }

  handle(request) {
    return super.handle(request).then(() => {
      const promise = new Promise((resolve, reject) => {
        http({
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.data,
          followRedirect: request.followRedirect
        }, (error, response, body) => {
          if (error) {
            if (error.code === 'ENOTFOUND') {
              return reject(new Error('It looks like you do not have a network connection. ' +
                'Please check that you are connected to a network and try again.'));
            }

            return reject(error);
          }

          request.response = {
            statusCode: response.statusCode,
            headers: response.headers,
            data: body
          };

          return resolve(request);
        });
      });
      return promise;
    });
  }
}
