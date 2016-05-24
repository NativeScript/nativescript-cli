'use strict';

var util = require('util');

function NotFoundError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, NotFoundError);
    }
}
util.inherits(NotFoundError, Error);

module.exports = NotFoundError;