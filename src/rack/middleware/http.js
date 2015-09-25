import Middleware from './middleware';
const Http = require(process.env.KINVEY_HTTP_LIB);

class HttpMiddleware extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    const httpRequest = Http.request(request);
    return httpRequest.send().then((response) => {
      request.response = response;
      return request;
    });
  }
}

export default HttpMiddleware;
