'use strict';

var Event = require('./Event');
var Database = require('./Database');
var FDBOpenDBRequest = require('./FDBOpenDBRequest');
var FDBDatabase = require('./FDBDatabase');
var FDBVersionChangeEvent = require('./FDBVersionChangeEvent');
var AbortError = require('./errors/AbortError');
var VersionError = require('./errors/VersionError');
var cmp = require('./cmp');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-a-database
function deleteDatabase(databases, name, request, cb) {
    try {
        var db;
        if (databases.hasOwnProperty(name)) {
            db = databases[name];
        } else {
            cb();
            return;
        }

        db.deletePending = true;

        var openDatabases = db.connections.filter(function (connection) {
            return !connection._closed;
        });

        openDatabases.forEach(function (openDatabase) {
            if (!openDatabase._closePending) {
                var event = new FDBVersionChangeEvent('versionchange', {
                    oldVersion: db.version,
                    newVersion: null
                });
                openDatabase.dispatchEvent(event);
            }
        });

        var anyOpen = openDatabases.some(function (openDatabase) {
            return !openDatabase._closed;
        });

        if (request && anyOpen) {
            var event = new FDBVersionChangeEvent('blocked', {
                oldVersion: db.version,
                newVersion: null
            });
            request.dispatchEvent(event);
        }
    } catch (err) {
        cb(err);
    }

    var waitForOthersClosed = function () {
        var anyOpen = openDatabases.some(function (openDatabase) {
            return !openDatabase._closed;
        });

        if (anyOpen) {
            setImmediate(waitForOthersClosed);
            return;
        }

        delete databases[name];

        cb();
    };

    waitForOthersClosed();
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-running-a-versionchange-transaction
function runVersionchangeTransaction(connection, version, request, cb) {
    connection._runningVersionchangeTransaction = true;

    var oldVersion = connection.version;

    var openDatabases = connection._rawDatabase.connections.filter(function (otherDatabase) {
        return connection !== otherDatabase;
    });

    openDatabases.forEach(function (openDatabase) {
        if (!openDatabase._closed) {
            var event = new FDBVersionChangeEvent('versionchange', {
                oldVersion: oldVersion,
                newVersion: version
            });
            openDatabase.dispatchEvent(event);
        }
    });

    var anyOpen = openDatabases.some(function (openDatabase) {
        return !openDatabase._closed;
    });

    if (anyOpen) {
        var event = new FDBVersionChangeEvent('blocked', {
            oldVersion: oldVersion,
            newVersion: version
        });
        request.dispatchEvent(event);
    }

    var waitForOthersClosed = function () {
        var anyOpen = openDatabases.some(function (openDatabase) {
            return !openDatabase._closed;
        });

        if (anyOpen) {
            setImmediate(waitForOthersClosed);
            return;
        }

//  Set the version of database to version. This change is considered part of the transaction, and so if the transaction is aborted, this change is reverted.
        connection._rawDatabase.version = version;
        connection.version = version;

// Get rid of this setImmediate?
        var transaction = connection.transaction(connection.objectStoreNames, 'versionchange');
        request.result = connection;
        request.transaction = transaction;

        transaction._rollbackLog.push(function () {
            connection._rawDatabase.version = oldVersion;
            connection.version = oldVersion;
        });

        var event = new FDBVersionChangeEvent('upgradeneeded', {
            oldVersion: oldVersion,
            newVersion: version
        });
        request.dispatchEvent(event);

        request.readyState = 'done';

        transaction.addEventListener('error', function () {
            connection._runningVersionchangeTransaction = false;
//throw arguments[0].target.error;
//console.log('error in versionchange transaction - not sure if anything needs to be done here', e.target.error.name);
        });
        transaction.addEventListener('abort', function () {
            connection._runningVersionchangeTransaction = false;
            request.transaction = null;
            setImmediate(function () {
                cb(new AbortError());
            });
        });
        transaction.addEventListener('complete', function () {
            connection._runningVersionchangeTransaction = false;
            request.transaction = null;
            // Let other complete event handlers run before continuing
            setImmediate(function () {
                if (connection._closePending) {
                    cb(new AbortError());
                } else {
                    cb(null);
                }
            });
        });
    };

    waitForOthersClosed();
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-opening-a-database
function openDatabase(databases, name, version, request, cb) {
    var db;
    if (databases.hasOwnProperty(name)) {
        db = databases[name];
    } else {
        db = new Database(name, 0);
        databases[name] = db;
    }

    if (version === undefined) {
        version = db.version !== 0 ? db.version : 1;
    }

    if (db.version > version) {
        return cb(new VersionError());
    }

    var connection = new FDBDatabase(databases[name]);

    if (db.version < version) {
        runVersionchangeTransaction(connection, version, request, function (err) {
            if (err) {
// DO THIS HERE: ensure that connection is closed by running the steps for closing a database connection before these steps are aborted.
                return cb(err);
            }

            cb(null, connection);
        });
    } else {
        cb(null, connection);
    }
}

module.exports = function () {
    this._databases = {};

    this.cmp = cmp;

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-deleteDatabase-IDBOpenDBRequest-DOMString-name
    this.deleteDatabase = function (name) {
        var request = new FDBOpenDBRequest();
        request.source = null;

        setImmediate(function () {
            var version = this._databases.hasOwnProperty(name) ? this._databases[name].version : null;
            deleteDatabase(this._databases, name, request, function (err) {
                var event;

                if (err) {
                    request.error = new Error();
                    request.error.name = err.name;

                    event = new Event('error', {
                        bubbles: true,
                        cancelable: false
                    });
                    event._eventPath = [];
                    request.dispatchEvent(event);

                    return;
                }

                request.result = undefined;

                event = new FDBVersionChangeEvent('success', {
                    oldVersion: version,
                    newVersion: null
                });
                request.dispatchEvent(event);
            });
        }.bind(this));

        return request;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-open-IDBOpenDBRequest-DOMString-name-unsigned-long-long-version
    this.open = function (name, version) {
        if (arguments.length > 1 && (isNaN(version) || version < 1 || version >= 9007199254740992)) {
            throw new TypeError();
        }

        var request = new FDBOpenDBRequest();
        request.source = null;

        setImmediate(function () {
            openDatabase(this._databases, name, version, request, function (err, connection) {
                var event;

                if (err) {
                    request.result = undefined;

                    request.error = new Error();
                    request.error.name = err.name;

                    event = new Event('error', {
                        bubbles: true,
                        cancelable: false
                    });
                    event._eventPath = [];
                    request.dispatchEvent(event);

                    return;
                }

                request.result = connection;

                event = new Event('success');
                event._eventPath = [];
                request.dispatchEvent(event);
            });
        }.bind(this));

        return request;
    };

    this.toString = function () {
        return '[object IDBFactory]';
    };
};
