const Middleware = require('./middleware');

class Serializer extends Middleware {
  constructor() {
    super('Kinvey Serializer Middleware');
  }

  handle(request) {
    return super.handle(request).then(() => {
      if (request && request.data) {
        const contentType = request.headers['content-type'] || request.headers['Content-Type'];

        if (contentType.indexOf('application/json') === 0) {
          request.data = JSON.stringify(request.data);
        }
      }

      return request;
    });
  }
}

module.exports = Serializer;
