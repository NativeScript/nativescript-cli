'use strict';

var util = require('util');

function ReadOnlyError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'The mutating operation was attempted in a "readonly" transaction.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ReadOnlyError);
    }
}
util.inherits(ReadOnlyError, Error);

module.exports = ReadOnlyError;