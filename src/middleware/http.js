import Middleware from './middleware';
import Http from '/* @echo HTTP_LIB */';
import Response from '../core/response';

class HttpMiddleware extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    // Create a http request
    let httpRequest = Http.request(request);

    // Send the http request
    return httpRequest.send().then((httpResponse) => {
      let statusCode = httpResponse.statusCode;
      let headers = httpResponse.headers;
      let data = httpResponse.data;

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
