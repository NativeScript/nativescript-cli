import { TimeoutError } from '../../../../errors';
import Middleware from './middleware';
import Promise from 'es6-promise';
import agent from 'superagent';

export default class HttpMiddleware extends Middleware {
  constructor(name = 'Http Middleware') {
    super(name);
  }

  handle(request) {
    const promise = new Promise((resolve, reject) => {
      const { url, method, headers, body, timeout, followRedirect } = request;
      const redirects = followRedirect === true ? 5 : 0;

      this.httpRequest = agent(method, url)
        .set(headers)
        .send(body)
        .timeout(timeout)
        .redirects(redirects)
        .end((error, response) => {
          this.httpRequest = undefined;

          if (error) {
            response = error.response;
          }

          if (!response) {
            if (error) {
              if (error.code === 'ECONNABORTED') {
                return reject(new TimeoutError(undefined, undefined, error.code));
              }
            }

            return reject(error);
          }

          return resolve({
            response: {
              statusCode: response.statusCode,
              headers: response.headers,
              data: response.body
            }
          });
        });
    });
    return promise;
  }

  cancel() {
    if (typeof this.httpRequest !== 'undefined') {
      this.httpRequest.abort();
    }

    return Promise.resolve();
  }
}
