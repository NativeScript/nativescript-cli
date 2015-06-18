import Middleware from './middleware';
import utils from '../core/utils';

class ParserMiddleware extends Middleware {
  constructor(name = 'Kinvey Parser Middleware') {
    super(name);
  }

  handle(request) {
    let response = request.response;

    if (utils.isDefined(response) && utils.isDefined(response.data)) {
      let contentType = response.getHeader('Content-Type');

      if (contentType.indexOf('application/json') === 0) {
        try {
          response.data = JSON.parse(response.data);
        } catch (err) { }

        request.response = response;
      }
    }

    return Promise.resolve(request);
  }
}

export default ParserMiddleware;
