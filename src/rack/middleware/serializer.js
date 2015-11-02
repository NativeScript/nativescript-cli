const Middleware = require('./middleware');
const Promise = require('bluebird');

class Serializer extends Middleware {
  constructor() {
    super('Kinvey Serializer Middleware');
  }

  handle(request) {
    if (request && request.data) {
      const contentType = request.headers['content-type'] || request.headers['Content-Type'];

      if (contentType.indexOf('application/json') === 0) {
        request.data = JSON.stringify(request.data);
      }
    }

    return Promise.resolve(request);
  }
}

module.exports = Serializer;
