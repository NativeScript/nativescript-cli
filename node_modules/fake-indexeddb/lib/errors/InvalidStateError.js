'use strict';

var util = require('util');

function InvalidStateError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'An operation was called on an object on which it is not allowed or at a time when it is not allowed. Also occurs if a request is made on a source object that has been deleted or removed. Use TransactionInactiveError or ReadOnlyError when possible, as they are more specific variations of InvalidStateError.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, InvalidStateError);
    }
}
util.inherits(InvalidStateError, Error);

module.exports = InvalidStateError;