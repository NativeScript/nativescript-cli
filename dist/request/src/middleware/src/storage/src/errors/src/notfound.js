'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function NotFoundError() {
  var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Not Found Error';
  var code = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 404;

  var error = Error.call(this, message);

  this.name = 'NotFoundError';
  this.message = error.message;
  this.stack = error.stack;
  this.code = code;
}

NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;

exports.default = NotFoundError;