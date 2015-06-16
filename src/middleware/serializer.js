let Middleware = require('./middleware');

class SerializerMiddleware extends Middleware {
  constructor() {
    super('Kinvey Serializer Middleware');
  }

  handle(request) {
    let contentType = request.getHeader('content-type');

    if (contentType === 'application/json') {
      request.data = JSON.stringify(request.data);
    }

    return Promise.resolve(request);
  }
}

export default SerializerMiddleware;
