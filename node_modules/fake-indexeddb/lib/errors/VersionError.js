'use strict';

var util = require('util');

function VersionError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'An attempt was made to open a database using a lower version than the existing version.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, VersionError);
    }
}
util.inherits(VersionError, Error);

module.exports = VersionError;