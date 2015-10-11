import Middleware from './middleware';

class ParserMiddleware extends Middleware {
  constructor(name = 'Kinvey Parser Middleware') {
    super(name);
  }

  handle(request) {
    const response = request.response;

    if (response && response.data) {
      const contentType = request.headers['content-type'] || request.headers['Content-Type'];

      if (contentType.indexOf('application/json') === 0) {
        try {
          response.data = JSON.parse(response.data);
        } catch (err) {
          response.data = response.data;
        }

        request.response = response;
      }
    }

    return Promise.resolve(request);
  }
}

export default ParserMiddleware;
