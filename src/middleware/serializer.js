let Middleware = require('./middleware');

class SerializerMiddleware extends Middleware {
  constructor() {
    super('Kinvey Serializer Middleware');
  }

  handle(request) {
    let contentType = request.getHeader('content-type');

    if (contentType.indexOf('application/json') === 0) {
      request.body = JSON.stringify(request.body);
    }

    return Promise.resolve(request);
  }
}

export default SerializerMiddleware;
