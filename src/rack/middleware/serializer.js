import Middleware from './middleware';

class SerializerMiddleware extends Middleware {
  constructor() {
    super('Kinvey Serializer Middleware');
  }

  handle(request) {
    if (request && request.body) {
      const contentType = request.headers['content-type'] || request.headers['Content-Type'];

      if (contentType.indexOf('application/json') === 0) {
        request.body = JSON.stringify(request.body);
      }
    }

    return Promise.resolve(request);
  }
}

export default SerializerMiddleware;
