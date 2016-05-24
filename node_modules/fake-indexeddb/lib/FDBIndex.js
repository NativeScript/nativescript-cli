'use strict';

var structuredClone = require('./structuredClone');
var FDBCursor = require('./FDBCursor');
var FDBCursorWithValue = require('./FDBCursorWithValue');
var FDBKeyRange = require('./FDBKeyRange');
var FDBRequest = require('./FDBRequest');
var InvalidStateError = require('./errors/InvalidStateError');
var TransactionInactiveError = require('./errors/TransactionInactiveError');
var cmp = require('./cmp');
var validateKey = require('./validateKey');

function confirmActiveTransaction(index) {
    if (!index.objectStore.transaction._active) {
        throw new TransactionInactiveError();
    }

    if (index._rawIndex.deleted || index.objectStore._rawObjectStore.deleted) {
        throw new InvalidStateError();
    }
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#idl-def-IDBIndex
module.exports = function (objectStore, rawIndex) {
    this._rawIndex = rawIndex;

    this.name = rawIndex.name;
    this.objectStore = objectStore;
    this.keyPath = rawIndex.keyPath;
    this.multiEntry = rawIndex.multiEntry;
    this.unique = rawIndex.unique;

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-openCursor-IDBRequest-any-range-IDBCursorDirection-direction
    this.openCursor = function (range, direction) {
        confirmActiveTransaction(this);

        if (range === null) { range = undefined; }
        if (range !== undefined && !(range instanceof FDBKeyRange)) {
            range = FDBKeyRange.only(structuredClone(validateKey(range)));
        }

        var request = new FDBRequest();
        request.source = this;
        request.transaction = this.objectStore.transaction;

        var cursor = new FDBCursorWithValue(this, range, direction);
        cursor._request = request;

        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: cursor._iterate.bind(cursor),
            request: request
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-openKeyCursor-IDBRequest-any-range-IDBCursorDirection-direction
    this.openKeyCursor = function (range, direction) {
        confirmActiveTransaction(this);

        if (range === null) { range = undefined; }
        if (range !== undefined && !(range instanceof FDBKeyRange)) {
            range = FDBKeyRange.only(structuredClone(validateKey(range)));
        }

        var request = new FDBRequest();
        request.source = this;
        request.transaction = this.objectStore.transaction;

        var cursor = new FDBCursor(this, range, direction);
        cursor._request = request;

        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: cursor._iterate.bind(cursor),
            request: request
        });
    };

    this.get = function (key) {
        confirmActiveTransaction(this);

        if (!(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: this._rawIndex.getValue.bind(this._rawIndex, key)
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-getKey-IDBRequest-any-key
    this.getKey = function (key) {
        confirmActiveTransaction(this);

        if (!(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: this._rawIndex.getKey.bind(this._rawIndex, key)
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-count-IDBRequest-any-key
    this.count = function (key) {
        confirmActiveTransaction(this);

        if (key !== undefined && !(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

// Should really use a cursor under the hood
        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: function () {
                var count;

                if (key instanceof FDBKeyRange) {
                    count = 0;
                    this._rawIndex.records.forEach(function (record) {
                        if (FDBKeyRange.check(key, record.key)) {
                            count += 1;
                        }
                    });
                } else if (key !== undefined) {
                    count = 0;
                    this._rawIndex.records.forEach(function (record) {
                        if (cmp(record.key, key) === 0) {
                            count += 1;
                        }
                    });
                } else {
                    count = this._rawIndex.records.length;
                }

                return count;
            }.bind(this)
        });
    };

    this.toString = function () {
        return '[object IDBIndex]';
    };
};