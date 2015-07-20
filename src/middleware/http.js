import Middleware from './middleware';
<<<<<<< Updated upstream
let Http = require(process.env.HTTP_LIB);
import Response from '../core/response';
=======
import Response from '../core/response';
const Http = require(process.env.KINVEY_HTTP_LIB);
>>>>>>> Stashed changes

class HttpMiddleware extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    // Create a http request
<<<<<<< Updated upstream
    let httpRequest = Http.request(request.toJSON());
=======
    const httpRequest = Http.request(request.toJSON());
>>>>>>> Stashed changes

    // Send the http request
    return httpRequest.send().then(({ statusCode, headers, data }) => {
      // Create a response
<<<<<<< Updated upstream
      let response = new Response(statusCode, headers, data);
=======
      const response = new Response(statusCode, headers, data);
>>>>>>> Stashed changes

      // Set the response on the request
      request.response = response;

      // Return the request
      return request;
    });
  }
}

export default HttpMiddleware;
