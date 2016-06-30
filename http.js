import { KinveyMiddleware } from 'kinvey-javascript-sdk-core/dist/rack/middleware';
import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import parseHeaders from 'parse-headers';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

/* eslint-disable */
@Injectable()
/* eslint-enable */
export class HttpMiddleware extends KinveyMiddleware {
  // Angular2 DI
  static get parameters() {
    return [[Http]];
  }

  constructor(http) {
    super('Angular2 Http Middleware');
    this.http = http;
  }

  async handle(request) {
    // Call super
    await super.handle(request);

    // Create the request options
    const { url, method, rawHeaders, body } = request;
    const headers = new Headers(rawHeaders.toJSON());
    const options = new RequestOptions({
      method: method,
      headers: headers,
      body: body
    });

    // Send the request
    const response = await this.http.request(url, options).toPromise();

    // Set the response on the request
    request.response = {
      statusCode: response.status,
      headers: parseHeaders(response.headers.toJSON()),
      data: response.json()
    };

    // Return the request
    return request;
  }
}
