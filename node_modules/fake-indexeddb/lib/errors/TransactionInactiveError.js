'use strict';

var util = require('util');

function TransactionInactiveError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'A request was placed against a transaction which is currently not active, or which is finished.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, TransactionInactiveError);
    }
}
util.inherits(TransactionInactiveError, Error);

module.exports = TransactionInactiveError;