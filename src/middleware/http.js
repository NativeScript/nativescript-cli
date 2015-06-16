import Middleware from './middleware';
import Http from '/* @echo HTTP_LIB */';
import Response from '../core/response';

class HttpMiddleware extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    let http = Http.request(request);
    return http.send().then((httpResponse) => {
      let response = new Response();
      response.addHeaders(httpResponse.headers);
      response.data = httpResponse.data;
      request.response = response;
      return request;
    });
  }
}

export default HttpMiddleware;
