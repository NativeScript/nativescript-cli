'use strict';

var FDBKeyRange = require('./FDBKeyRange');
var ConstraintError = require('./errors/ConstraintError');
var cmp = require('./cmp');
var extractKey = require('./extractKey');
var validateKey = require('./validateKey');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-index
module.exports = function (rawObjectStore, name, keyPath, multiEntry, unique) {
    this.records = [];
    this.rawObjectStore = rawObjectStore;
    this.initialized = false;
    this.deleted = false;
// Initialized should be used to decide whether to throw an error or abort the versionchange transaction when there is a constraint

    this.name = name;
    this.keyPath = keyPath;
    this.multiEntry = multiEntry;
    this.unique = unique;

    this._getRecord = function (key) {
        var record;
        if (key instanceof FDBKeyRange) {
            record = this.records.find(function (record) {
                return FDBKeyRange.check(key, record.key);
            });
        } else {
            record = this.records.find(function (record) {
                return cmp(record.key, key) === 0;
            });
        }
        return record;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-index
    this.getKey = function (key) {
        var record = this._getRecord(key);

        return record !== undefined ? record.value : undefined;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#index-referenced-value-retrieval-operation
    this.getValue = function (key) {
        var record = this._getRecord(key);

        return record !== undefined ? this.rawObjectStore.getValue(record.value) : undefined;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store (step 7)
    this.storeRecord = function (newRecord) {
        var indexKey = extractKey(this.keyPath, newRecord.value);
        if (indexKey === undefined) {
            return;
        }

        if (!this.multiEntry || !Array.isArray(indexKey)) {
            try {
                validateKey(indexKey);
            } catch (e) {
                return;
            }
        } else {
            // remove any elements from index key that are not valid keys and remove any duplicate elements from index key such that only one instance of the duplicate value remains.
            var keep = [];
            indexKey.forEach(function (part) {
                if (keep.indexOf(part) < 0) {
                    try {
                        validateKey(part);
                        keep.push(part);
                    } catch (err) { /* Do nothing */ }
                }
            });
            indexKey = keep;
        }

        if (!this.multiEntry || !Array.isArray(indexKey)) {
            if (this.unique) {
                var i = this.records.findIndex(function (record) {
                    return cmp(record.key, indexKey) === 0;
                });
                if (i >= 0) {
                    throw new ConstraintError();
                }
            }
        } else {
            if (this.unique) {
                indexKey.forEach(function (individualIndexKey) {
                    this.records.forEach(function (record) {
                        if (cmp(record.key, individualIndexKey) === 0) {
                            throw new ConstraintError();
                        }
                    });
                }.bind(this));
            }
        }

        // Store record {key (indexKey) and value (recordKey)} sorted ascending by key (primarily) and value (secondarily)
        var storeInIndex = function (newRecord) {
            var i = this.records.findIndex(function (record) {
                return cmp(record.key, newRecord.key) >= 0;
            });

            // If no matching key, add to end
            if (i === -1) {
                i = this.records.length;
            } else {
                // If matching key, advance to appropriate position based on value
                while (i < this.records.length && cmp(this.records[i].key, newRecord.key) === 0) {
                    if (cmp(this.records[i].value, newRecord.value) !== -1) {
                        // Record value >= newRecord value, so insert here
                        break;
                    }

                    i += 1; // Look at next record
                }
            }

            this.records.splice(i, 0, newRecord);
        }.bind(this);

        if (!this.multiEntry || !Array.isArray(indexKey)) {
            storeInIndex({
                key: indexKey,
                value: newRecord.key
            });
        } else {
            indexKey.forEach(function (individualIndexKey) {
                storeInIndex({
                    key: individualIndexKey,
                    value: newRecord.key
                });
            });
        }
    };

    this.initialize = function (transaction) {
        if (this.initialized) {
            throw new Error("Index already initialized");
        }

        transaction._execRequestAsync({
            source: null,
            operation: function () {
                try {
                    // Create index based on current value of objectstore
                    this.rawObjectStore.records.forEach(function (record) {
                        this.storeRecord(record);
                    }.bind(this));

                    this.initialized = true;
                } catch (err) {
                    transaction._abort(err.name);
                }
            }.bind(this)
        });
    };
};