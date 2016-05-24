'use strict';

var structuredClone = require('./structuredClone');
var FDBKeyRange = require('../lib/FDBKeyRange');
var KeyGenerator = require('./KeyGenerator');
var ConstraintError = require('./errors/ConstraintError');
var DataError = require('./errors/DataError');
var cmp = require('./cmp');
var extractKey = require('./extractKey');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-object-store
module.exports = function (rawDatabase, name, keyPath, autoIncrement) {
    this.rawDatabase = rawDatabase;
    this.records = [];
    this.rawIndexes = {};
    this.keyGenerator = autoIncrement === true ? new KeyGenerator() : null;
    this.deleted = false;

    this.name = name;
    this.keyPath = keyPath;
    this.autoIncrement = autoIncrement;

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-object-store
    this.getValue = function (key) {
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

        return record !== undefined ? structuredClone(record.value) : undefined;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store
    this.storeRecord = function (newRecord, noOverwrite, rollbackLog) {
        if (this.keyPath !== null) {
            var key = extractKey(this.keyPath, newRecord.value);
            if (key !== undefined) {
                newRecord.key = key;
            }
        }

        var i;
        if (this.keyGenerator !== null && newRecord.key === undefined) {
            if (rollbackLog) {
                rollbackLog.push(function (keyGeneratorBefore) {
                    this.keyGenerator.num = keyGeneratorBefore;
                }.bind(this, this.keyGenerator.num));
            }

            newRecord.key = this.keyGenerator.next();

            // Set in value if keyPath defiend but led to no key
            // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-to-assign-a-key-to-a-value-using-a-key-path
            if (this.keyPath !== null) {
                var remainingKeyPath = this.keyPath;
                var object = newRecord.value;
                var identifier;

                i = 0; // Just to run the loop at least once
                while (i >= 0) {
                    if (typeof object !== 'object') {
                        throw new DataError();
                    }

                    i = remainingKeyPath.indexOf('.');
                    if (i >= 0) {
                        identifier = remainingKeyPath.slice(0, i);
                        remainingKeyPath = remainingKeyPath.slice(i + 1);

                        if (!object.hasOwnProperty(identifier)) {
                            object[identifier] = {};
                        }

                        object = object[identifier];
                    }
                }

                identifier = remainingKeyPath;

                object[identifier] = newRecord.key;
            }
        } else if (this.keyGenerator !== null && typeof newRecord.key === 'number') {
            this.keyGenerator.setIfLarger(newRecord.key);
        }

        i = this.records.findIndex(function (record) {
            return cmp(record.key, newRecord.key) === 0;
        });

        if (i >= 0) {
            if (noOverwrite) {
                throw new ConstraintError();
            }
            this.deleteRecord(newRecord.key, rollbackLog);
        }

        // Find where to put it so it's sorted by key
        if (this.records.length === 0) {
            i = 0;
        }
        i = this.records.findIndex(function (record) {
            return cmp(record.key, newRecord.key) === 1;
        });
        if (i === -1) {
            i = this.records.length;
        }
        this.records.splice(i, 0, newRecord);

        // Update indexes
        Object.keys(this.rawIndexes).forEach(function (name) {
            if (this.rawIndexes[name].initialized) {
                this.rawIndexes[name].storeRecord(newRecord);
            }
        }.bind(this));

        if (rollbackLog) {
            rollbackLog.push(this.deleteRecord.bind(this, newRecord.key));
        }

        return newRecord.key;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-records-from-an-object-store
    this.deleteRecord = function (key, rollbackLog) {
        var range;
        if (key instanceof FDBKeyRange) {
            range = key;
        } else {
            range = FDBKeyRange.only(key);
        }

        this.records = this.records.filter(function (record) {
            var shouldDelete = FDBKeyRange.check(range, record.key);

            if (shouldDelete && rollbackLog) {
                rollbackLog.push(this.storeRecord.bind(this, record, true));
            }

            return !shouldDelete;
        }.bind(this));

        Object.keys(this.rawIndexes).forEach(function (name) {
            var rawIndex = this.rawIndexes[name];
            rawIndex.records = rawIndex.records.filter(function (record) {
                return !FDBKeyRange.check(range, record.value);
            });
        }.bind(this));
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-clearing-an-object-store
    this.clear = function (rollbackLog) {
        if (rollbackLog) {
            this.records.forEach(function (record) {
                rollbackLog.push(this.storeRecord.bind(this, record, true));
            }.bind(this));
        }

        this.records = [];
        Object.keys(this.rawIndexes).forEach(function (name) {
            var rawIndex = this.rawIndexes[name];
            rawIndex.records = [];
        }.bind(this));
    };
};