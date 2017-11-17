const Promise = require('es6-promise');
const { KinveyError } = require('kinvey-errors');
const { Middleware } = require('./middleware');

exports.HttpMiddleware = class HttpMiddleware extends Middleware {
  constructor(name = 'Http Middleware') {
    super(name);
  }

  handle() {
    return Promise.reject(new KinveyError('Unable to send network request.',
      'Please override the core HttpMiddleware.'));
  }

  cancel() {
    return Promise.resolve();
  }
}
