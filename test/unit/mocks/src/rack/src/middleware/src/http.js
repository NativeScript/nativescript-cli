import Middleware from 'kinvey-javascript-rack';
import Http from './network';

export default class HttpMiddleware extends Middleware {
  constructor(name = 'Http Middleware') {
    super(name);
  }

  handle(request, response) {
    const http = new Http();
    return http.handle(request, response);
  }
}
