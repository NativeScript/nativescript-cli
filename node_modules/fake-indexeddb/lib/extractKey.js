'use strict';

var structuredClone = require('./structuredClone');
var validateKey = require('./validateKey');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-extracting-a-key-from-a-value-using-a-key-path
function extractKey(keyPath, value) {
    if (Array.isArray(keyPath)) {
        var result = [];

        keyPath.forEach(function (item) {
            // This doesn't make sense to me based on the spec, but it is needed to pass the W3C KeyPath tests (see same comment in validateKey)
            if (item !== undefined && item !== null && typeof item !== 'string' && item.toString) {
                item = item.toString();
            }
            result.push(structuredClone(validateKey(extractKey(item, value))));
        });

        return result;
    }

    if (keyPath === '') {
        return value;
    }

    var remainingKeyPath = keyPath;
    var object = value;

    while (remainingKeyPath !== null) {
        var identifier;

        var i = remainingKeyPath.indexOf('.');
        if (i >= 0) {
            identifier = remainingKeyPath.slice(0, i);
            remainingKeyPath = remainingKeyPath.slice(i + 1);
        } else {
            identifier = remainingKeyPath;
            remainingKeyPath = null;
        }

        if (!object.hasOwnProperty(identifier)) {
            return;
        }

        object = object[identifier];
    }

    return object;
}

module.exports = extractKey;