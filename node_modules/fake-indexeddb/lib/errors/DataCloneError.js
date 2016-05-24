'use strict';

var util = require('util');

function DataCloneError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'The data being stored could not be cloned by the internal structured cloning algorithm.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DataCloneError);
    }
}
util.inherits(DataCloneError, Error);

module.exports = DataCloneError;