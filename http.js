import { KinveyMiddleware } from 'kinvey-javascript-sdk-core/dist/rack/middleware';
import { provide, ReflectiveInjector } from '@angular/core';
import { HTTP_PROVIDERS, Headers, Http, RequestOptions, XSRFStrategy } from '@angular/http';
import { Promise } from 'es6-promise';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

class FakeXSRFStrategy extends XSRFStrategy {
  configureRequest() { /* */ }
}
const XRSF_STRATEGY = provide(XSRFStrategy, { useValue: new FakeXSRFStrategy() });

export class HttpMiddleware extends KinveyMiddleware {
  constructor() {
    super('Angular2 Http Middleware');
  }

  async handle(request) {
    // Call super
    await super.handle(request);

    return new Promise((resolve, reject) => {
      // Create the request options
      const { url, method, headers, body } = request;
      const ng2Headers = new Headers(headers.toJSON());
      const options = new RequestOptions({
        method: method,
        headers: ng2Headers,
        body: body
      });

      // Send the request
      const http = ReflectiveInjector.resolveAndCreate([...HTTP_PROVIDERS, XRSF_STRATEGY]).get(Http);
      const observable = http.request(url, options);
      observable.subscribe(response => {
        const headers = {};
        const headerKeys = response.headers.keys();

        for (const key of headerKeys) {
          headers[key] = response.headers.get(key);
        }

        // Set the response on the request
        request.response = {
          statusCode: response.status,
          headers: headers,
          data: response.text()
        };
      }, error => {
        reject(error);
      }, () => {
        resolve(request);
      });
    });
  }
}
