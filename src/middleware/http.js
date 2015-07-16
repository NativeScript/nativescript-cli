import Middleware from './middleware';
let Http = require(process.env.HTTP_LIB);
import Response from '../core/response';

class HttpMiddleware extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    // Create a http request
    let httpRequest = Http.request(request.toJSON());

    // Send the http request
    return httpRequest.send().then(({ statusCode, headers, data }) => {
      // Create a response
      let response = new Response(statusCode, headers, data);

      // Set the response on the request
      request.response = response;

      // Return the request
      return request;
    });
  }
}

export default HttpMiddleware;
