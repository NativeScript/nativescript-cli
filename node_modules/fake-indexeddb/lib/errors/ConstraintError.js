'use strict';

var util = require('util');

function ConstraintError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : ' A mutation operation in the transaction failed because a constraint was not satisfied. For example, an object such as an object store or index already exists and a request attempted to create a new one.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ConstraintError);
    }
}
util.inherits(ConstraintError, Error);

module.exports = ConstraintError;