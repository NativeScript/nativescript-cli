'use strict';

var util = require('util');
var EventTarget = require('./EventTarget');
var FDBTransaction = require('./FDBTransaction');
var ObjectStore = require('./ObjectStore');
var ConstraintError = require('./errors/ConstraintError');
var InvalidAccessError = require('./errors/InvalidAccessError');
var InvalidStateError = require('./errors/InvalidStateError');
var NotFoundError = require('./errors/NotFoundError');
var TransactionInactiveError = require('./errors/TransactionInactiveError');
var addDomStringListMethods = require('./addDomStringListMethods');
var validateKeyPath = require('./validateKeyPath');

function confirmActiveVersionchangeTransaction(database) {
    if (!database._runningVersionchangeTransaction) {
        throw new InvalidStateError();
    }

    var transaction = database._rawDatabase.transactions.find(function (transaction) {
        return transaction._active && transaction.mode === 'versionchange';
    });
    if (!transaction) {
        throw new TransactionInactiveError();
    }

    return transaction;
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#database-closing-steps
function closeConnection(connection) {
    connection._closePending = true;

    var transactionsComplete = connection._rawDatabase.transactions.every(function (transaction) {
        return transaction._finished;
    });

    if (transactionsComplete) {
        connection._closed = true;
        connection._rawDatabase.connections = connection._rawDatabase.connections.filter(function (otherConnection) {
            return connection !== otherConnection;
        });
    } else {
        setImmediate(function () {
            closeConnection(connection);
        });
    }
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#database-interface
function FDBDatabase(rawDatabase) {
    EventTarget.call(this);

    this._closePending = false;
    this._closed = false;
    this._runningVersionchangeTransaction = false;
    this._rawDatabase = rawDatabase;
    this._rawDatabase.connections.push(this);

    this.name = rawDatabase.name;
    this.version = rawDatabase.version;
    this.objectStoreNames = Object.keys(rawDatabase.rawObjectStores).sort();
    addDomStringListMethods(this.objectStoreNames);

    this.createObjectStore = function (name, optionalParameters) {
        if (name === undefined) { throw new TypeError(); }
        var transaction = confirmActiveVersionchangeTransaction(this);

        if (this._rawDatabase.rawObjectStores.hasOwnProperty(name)) {
            throw new ConstraintError();
        }

        optionalParameters = optionalParameters || {};
        var keyPath = optionalParameters.keyPath !== undefined ? optionalParameters.keyPath : null;
        var autoIncrement = optionalParameters.autoIncrement !== undefined ? optionalParameters.autoIncrement : false;

        if (keyPath !== null) {
            validateKeyPath(keyPath);
        }

        if (autoIncrement && (keyPath === '' || Array.isArray(keyPath))) {
            throw new InvalidAccessError();
        }

        transaction._rollbackLog.push(function (objectStoreNames) {
            this.objectStoreNames = objectStoreNames;
            addDomStringListMethods(this.objectStoreNames);
            delete this._rawDatabase.rawObjectStores[name];
        }.bind(this, this.objectStoreNames.slice()));

        var objectStore = new ObjectStore(this._rawDatabase, name, keyPath, autoIncrement);
        this.objectStoreNames.push(name);
        this.objectStoreNames.sort();
        this._rawDatabase.rawObjectStores[name] = objectStore;

        return transaction.objectStore(name);
    };

    this.deleteObjectStore = function (name) {
        if (name === undefined) { throw new TypeError(); }
        var transaction = confirmActiveVersionchangeTransaction(this);

        if (!this._rawDatabase.rawObjectStores.hasOwnProperty(name)) {
            throw new NotFoundError();
        }

        this.objectStoreNames = this.objectStoreNames.filter(function (objectStoreName) {
            return objectStoreName !== name;
        });
        addDomStringListMethods(this.objectStoreNames);

        transaction._rollbackLog.push(function (store) {
            store.deleted = false;
            this._rawDatabase.rawObjectStores[name] = store;
            this.objectStoreNames.push(name);
            this.objectStoreNames.sort();
        }.bind(this, this._rawDatabase.rawObjectStores[name]));

        this._rawDatabase.rawObjectStores[name].deleted = true;
        delete this._rawDatabase.rawObjectStores[name];
    };

    this.transaction = function (storeNames, mode) {
        mode = mode !== undefined ? mode : 'readonly';
        if (mode !== 'readonly' && mode !== 'readwrite' && mode !== 'versionchange') {
            throw new TypeError('Invalid mode: ' + mode);
        }

        var hasActiveVersionchange = this._rawDatabase.transactions.some(function (transaction) {
            return transaction._active && transaction.mode === 'versionchange';
        });
        if (hasActiveVersionchange) {
            throw new InvalidStateError();
        }

        if (this._closePending) {
            throw new InvalidStateError();
        }

        if (!Array.isArray(storeNames)) {
            storeNames = [storeNames];
        }
        if (storeNames.length === 0 && mode !== 'versionchange') {
            throw new InvalidAccessError();
        }
        storeNames.forEach(function (storeName) {
            if (this.objectStoreNames.indexOf(storeName) < 0) {
                throw new NotFoundError('No objectStore named ' + storeName + ' in this database');
            }
        }.bind(this));

        var tx = new FDBTransaction(storeNames, mode);
        tx.db = this;
        this._rawDatabase.transactions.push(tx);
        this._rawDatabase.processTransactions(); // See if can start right away (async)

        return tx;
    };

    this.close = function () {
        closeConnection(this);
    };

    this.toString = function () {
        return '[object IDBDatabase]';
    };
}
util.inherits(FDBDatabase, EventTarget);

module.exports = FDBDatabase;
