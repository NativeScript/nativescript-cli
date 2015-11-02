const Middleware = require('./middleware');
const Promise = require('bluebird');

class Parser extends Middleware {
  constructor(name = 'Kinvey Parser Middleware') {
    super(name);
  }

  handle(request) {
    const response = request.response;

    if (response && response.data) {
      const contentType = response.headers['content-type'] || response.headers['Content-Type'];

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

module.exports = Parser;
