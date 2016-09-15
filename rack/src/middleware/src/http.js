import { Middleware } from 'kinvey-javascript-rack';
import { Headers, RequestOptions } from '@angular/http';
import { Promise } from 'es6-promise';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars


export class HttpMiddleware extends Middleware {
  constructor(name = 'Angular2 Http Middleware', http) {
    super(name);
    this.http = http;
  }

  async handle(request) {
    return new Promise((resolve, reject) => {
      // Create the request options
      const { url, method, headers, body } = request;
      const ng2Headers = new Headers(headers);
      const options = new RequestOptions({
        method: method,
        headers: ng2Headers,
        body: body
      });

      // Send the request
      const observable = this.http.request(url, options);
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
