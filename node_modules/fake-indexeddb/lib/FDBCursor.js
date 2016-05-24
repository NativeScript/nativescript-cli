'use strict';

var structuredClone = require('./structuredClone');
var FDBKeyRange = require('./FDBKeyRange');
var DataError = require('./errors/DataError');
var InvalidStateError = require('./errors/InvalidStateError');
var ReadOnlyError = require('./errors/ReadOnlyError');
var TransactionInactiveError = require('./errors/TransactionInactiveError');
var cmp = require('./cmp');
var extractKey = require('./extractKey');
var validateKey = require('./validateKey');

function getEffectiveObjectStore(cursor) {
    if (cursor.source.hasOwnProperty('_rawIndex')) {
        return cursor.source.objectStore;
    }
    return cursor.source;
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#cursor
module.exports = function (source, range, direction, request) {
    this._gotValue = false;
    this._range = range;
    this._position = undefined; // Key of previously returned record
    this._objectStorePosition = undefined;
    this._request = request;

// Not sure if this is a good way to make things readonly. Messy if other classes need to update a value that is to be presented to the user as readonly, like FDBCursorWithValue.value
    var ro = {
        source: source,
        direction: direction !== undefined ? direction : 'next',
        key: undefined,
        primaryKey: undefined
    };
    Object.defineProperty(this, 'source', {
        get: function () {
            return ro.source;
        }
    });
    Object.defineProperty(this, 'direction', {
        get: function () {
            return ro.direction;
        }
    });
    Object.defineProperty(this, 'key', {
        get: function () {
            return ro.key;
        }
    });
    Object.defineProperty(this, 'primaryKey', {
        get: function () {
            return ro.primaryKey;
        }
    });

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-iterating-a-cursor
    this._iterate = function (key) {
        var sourceIsObjectStore = !this.source.hasOwnProperty('_rawIndex');

        var records;
        if (sourceIsObjectStore) {
            records = this.source._rawObjectStore.records;
        } else {
            records = this.source._rawIndex.records;
        }

        var foundRecord;
        if (this.direction === "next") {
            foundRecord = records.find(function (record) {
                if (key !== undefined) {
                    if (cmp(record.key, key) === -1) {
                        return false;
                    }
                }
                if (this._position !== undefined && sourceIsObjectStore) {
                    if (cmp(record.key, this._position) !== 1) {
                        return false;
                    }
                }
                if (this._position !== undefined && !sourceIsObjectStore) {
                    var cmpResult = cmp(record.key, this._position);
                    if (cmpResult === -1) {
                        return false;
                    }
                    if (cmpResult === 0 && cmp(record.value, this._objectStorePosition) !== 1) {
                        return false;
                    }
                }
                if (this._range !== undefined) {
                    if (!FDBKeyRange.check(this._range, record.key)) {
                        return false;
                    }
                }
                return true;
            }.bind(this));
        } else if (this.direction === "nextunique") {
            foundRecord = records.find(function (record) {
                if (key !== undefined) {
                    if (cmp(record.key, key) === -1) {
                        return false;
                    }
                }
                if (this._position !== undefined) {
                    if (cmp(record.key, this._position) !== 1) {
                        return false;
                    }
                }
                if (this._range !== undefined) {
                    if (!FDBKeyRange.check(this._range, record.key)) {
                        return false;
                    }
                }
                return true;
            }.bind(this));
        } else if (this.direction === "prev") {
            foundRecord = records.reverse().find(function (record) {
                if (key !== undefined) {
                    if (cmp(record.key, key) === 1) {
                        return false;
                    }
                }
                if (this._position !== undefined && sourceIsObjectStore) {
                    if (cmp(record.key, this._position) !== -1) {
                        return false;
                    }
                }
                if (this._position !== undefined && !sourceIsObjectStore) {
                    var cmpResult = cmp(record.key, this._position);
                    if (cmpResult === 1) {
                        return false;
                    }
                    if (cmpResult === 0 && cmp(record.value, this._objectStorePosition) !== -1) {
                        return false;
                    }
                }
                if (this._range !== undefined) {
                    if (!FDBKeyRange.check(this._range, record.key)) {
                        return false;
                    }
                }
                return true;
            }.bind(this));
            records.reverse();
        } else if (this.direction === "prevunique") {
            var tempRecord = records.reverse().find(function (record) {
                if (key !== undefined) {
                    if (cmp(record.key, key) === 1) {
                        return false;
                    }
                }
                if (this._position !== undefined) {
                    if (cmp(record.key, this._position) !== -1) {
                        return false;
                    }
                }
                if (this._range !== undefined) {
                    if (!FDBKeyRange.check(this._range, record.key)) {
                        return false;
                    }
                }
                return true;
            }.bind(this));
            records.reverse();


            if (tempRecord) {
                foundRecord = records.find(function (record) {
                    return cmp(record.key, tempRecord.key) === 0;
                });
            }
        }

        var result;
        if (!foundRecord) {
            ro.key = undefined;
            if (!sourceIsObjectStore) { this._objectStorePosition = undefined; }
            this.value = undefined;
            result = null;
        } else {
            this._position = foundRecord.key;
            if (!sourceIsObjectStore) { this._objectStorePosition = foundRecord.value; }
            ro.key = foundRecord.key;
            if (sourceIsObjectStore) {
                this.value = structuredClone(foundRecord.value);
            } else {
                this.value = structuredClone(this.source.objectStore._rawObjectStore.getValue(foundRecord.value));
                ro.primaryKey = structuredClone(foundRecord.value);
            }
            this._gotValue = true;
            result = this;
        }

        return result;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-update-IDBRequest-any-value
    this.update = function (value) {
        if (value === undefined) { throw new TypeError(); }

        var effectiveObjectStore = getEffectiveObjectStore(this);
        var effectiveKey = this.source.hasOwnProperty('_rawIndex') ? this.primaryKey : this._position;
        var transaction = effectiveObjectStore.transaction;

        if (transaction.mode === 'readonly') {
            throw new ReadOnlyError();
        }

        if (!transaction._active) {
            throw new TransactionInactiveError();
        }

        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        if (!this._gotValue || !this.hasOwnProperty('value')) {
            throw new InvalidStateError();
        }

        if (effectiveObjectStore.keyPath !== null) {
            var tempKey;

            try {
                tempKey = extractKey(effectiveObjectStore.keyPath, value);
            } catch (err) { /* Handled immediately below */ }

            if (tempKey !== effectiveKey) {
                throw new DataError();
            }
        }

        var record = {
            key: effectiveKey,
            value: structuredClone(value)
        };

        return transaction._execRequestAsync({
            source: this,
            operation: effectiveObjectStore._rawObjectStore.storeRecord.bind(effectiveObjectStore._rawObjectStore, record, false, transaction._rollbackLog)
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-advance-void-unsigned-long-count
    this.advance = function (count) {
        if (!Number.isInteger(count) || count <= 0) { throw new TypeError(); }

        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;

        if (!transaction._active) {
            throw new TransactionInactiveError();
        }

        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        if (!this._gotValue) {
            throw new InvalidStateError();
        }

        this._request.readyState = 'pending';
        transaction._execRequestAsync({
            source: this.source,
            operation: function () {
                var result;
                for (var i = 0; i < count; i++) {
                    result = this._iterate();

                    // Not sure why this is needed
                    if (!result) {
                        break;
                    }
                }
                return result;
            }.bind(this),
            request: this._request
        });

        this._gotValue = false;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-continue-void-any-key
    this.continue = function (key) {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;

        if (!transaction._active) {
            throw new TransactionInactiveError();
        }

        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        if (!this._gotValue) {
            throw new InvalidStateError();
        }

        if (key !== undefined) {
            validateKey(key);

            var cmpResult = cmp(key, this._position);

            if ((cmpResult <= 0 && (this.direction === 'next' || this.direction === 'nextunique')) ||
                (cmpResult >= 0 && (this.direction === 'prev' || this.direction === 'prevunique'))) {
                throw new DataError();
            }
        }

        this._request.readyState = 'pending';
        transaction._execRequestAsync({
            source: this.source,
            operation: this._iterate.bind(this, key),
            request: this._request
        });

        this._gotValue = false;
    };

    this.delete = function () {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var effectiveKey = this.source.hasOwnProperty('_rawIndex') ? this.primaryKey : this._position;
        var transaction = effectiveObjectStore.transaction;

        if (transaction.mode === 'readonly') {
            throw new ReadOnlyError();
        }

        if (!transaction._active) {
            throw new TransactionInactiveError();
        }

        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        if (!this._gotValue || !this.hasOwnProperty('value')) {
            throw new InvalidStateError();
        }

        return transaction._execRequestAsync({
            source: this,
            operation: effectiveObjectStore._rawObjectStore.deleteRecord.bind(effectiveObjectStore._rawObjectStore, effectiveKey, transaction._rollbackLog)
        });
    };

    this.toString = function () {
        return '[object IDBCursor]';
    };
};