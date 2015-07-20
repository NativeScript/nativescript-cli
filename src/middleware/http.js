import Middleware from './middleware';
import Response from '../core/response';
const Http = require(process.env.KINVEY_HTTP_LIB);

class HttpMiddleware extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    // Create a http request
    const httpRequest = Http.request(request.toJSON());

    // Send the http request
    return httpRequest.send().then(({ statusCode, headers, data }) => {
      // Create a response
      const response = new Response(statusCode, headers, data);

      // Set the response on the request
      request.response = response;

      // Return the request
      return request;
    });
  }
}

export default HttpMiddleware;
