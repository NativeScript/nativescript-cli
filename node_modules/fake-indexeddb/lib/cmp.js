'use strict';

var DataError = require('./errors/DataError');
var validateKey = require('./validateKey');

function getType(x) {
    if (typeof x === 'number') {
        return 'Number';
    }
    if (x instanceof Date) {
        return 'Date';
    }
    if (Array.isArray(x)) {
        return 'Array';
    }
    if (typeof x === 'string') {
        return 'String';
    }

    throw new DataError();
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-cmp-short-any-first-any-second
function cmp(first, second) {
    if (second === undefined) { throw new TypeError(); }

    validateKey(first);
    validateKey(second);

    var t1 = getType(first);
    var t2 = getType(second);

    if (t1 !== t2) {
        if (t1 === 'Array') {
            return 1;
        }
        if (t1 === 'String' && (t2 === 'Date' || t2 === 'Number')) {
            return 1;
        }
        if (t1 === 'Date' && t2 === 'Number') {
            return 1;
        }
        return -1;
    }

    if (t1 === 'Array') {
        var length = Math.min(first.length, second.length);
        for (var i = 0; i < length; i++) {
            var result = cmp(first[i], second[i]);

            if (result !== 0) {
                return result;
            }
        }

        if (first.length > second.length) {
            return 1;
        }
        if (first.length < second.length) {
            return -1;
        }
        return 0;
    }

    if (t1 === 'Date') {
        if (first.getTime() === second.getTime()) {
            return 0;
        }
    } else {
        if (first === second) {
            return 0;
        }
    }
    return first > second ? 1 : -1;
}

module.exports = cmp;
