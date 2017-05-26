"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("kinvey-js-sdk/dist/utils");
var errors_1 = require("kinvey-js-sdk/dist/errors");
var NativeScriptSQLite = require('nativescript-sqlite');
var masterCollectionName = 'sqlite_master';
var isSupported;
var SQLite = (function () {
    function SQLite(name) {
        if (name === void 0) { name = 'kinvey'; }
        if (utils_1.isDefined(name) === false) {
            throw new Error('A name is required to use the SQLite adapter.');
        }
        if (typeof name !== 'string') {
            throw new Error('The name must be a string to use the SQLite adapter');
        }
        this.name = name;
    }
    SQLite.prototype.openTransaction = function (collection, query, parameters, write) {
        if (write === void 0) { write = false; }
        var escapedCollection = "\"" + collection + "\"";
        var isMaster = collection === masterCollectionName;
        var isMulti = Array.isArray(query);
        query = isMulti ? query : [[query, parameters]];
        return new NativeScriptSQLite(this.name)
            .then(function (db) {
            db.resultType(NativeScriptSQLite.RESULTSASOBJECT);
            if (write && isMaster === false) {
                return db.execSQL("CREATE TABLE IF NOT EXISTS " + escapedCollection
                    + ' (key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)')
                    .then(function () { return db; });
            }
            return db;
        })
            .then(function (db) {
            var responses = [];
            if (query.length === 0) {
                return isMulti ? responses : responses.shift();
            }
            return query.reduce(function (prev, parts) {
                var sql = parts[0].replace('#{collection}', escapedCollection);
                return prev
                    .then(function () {
                    if (write === false) {
                        return db.all(sql, parts[1]);
                    }
                    return db.execSQL(sql, parts[1]);
                })
                    .then(function (resultSet) {
                    if (resultSet === void 0) { resultSet = []; }
                    if (write === false && Array.isArray(resultSet) && resultSet.length > 0) {
                        for (var i = 0, len = resultSet.length; i < len; i += 1) {
                            try {
                                var row = resultSet[i];
                                var entity = isMaster ? row.value : JSON.parse(row.value);
                                responses.push(entity);
                            }
                            catch (error) {
                            }
                        }
                    }
                    else if (write === true) {
                        responses.push(resultSet);
                    }
                    return responses;
                });
            }, Promise.resolve());
        });
    };
    SQLite.prototype.find = function (collection) {
        var sql = 'SELECT value FROM #{collection}';
        return this.openTransaction(collection, sql, [])
            .catch(function () { return []; });
    };
    SQLite.prototype.findById = function (collection, id) {
        var _this = this;
        var sql = 'SELECT value FROM #{collection} WHERE key = ?';
        return this.openTransaction(collection, sql, [id])
            .then(function (entities) {
            if (entities.length === 0) {
                throw new errors_1.NotFoundError("An entity with _id = " + id + " was not found in the " + collection
                    + (" collection on the " + _this.name + " SQLite database."));
            }
            return entities[0];
        })
            .catch(function () {
            throw new errors_1.NotFoundError("An entity with _id = " + id + " was not found in the " + collection
                + (" collection on the " + _this.name + " SQLite database."));
        });
    };
    SQLite.prototype.save = function (collection, entities) {
        var queries = [];
        var singular = false;
        if (Array.isArray(entities) === false) {
            singular = true;
            entities = [entities];
        }
        if (entities.length === 0) {
            return Promise.resolve(null);
        }
        entities = entities.map(function (entity) {
            queries.push([
                'REPLACE INTO #{collection} (key, value) VALUES (?, ?)',
                [entity._id, JSON.stringify(entity)]
            ]);
            return entity;
        });
        return this.openTransaction(collection, queries, null, true)
            .then(function () { return (singular ? entities[0] : entities); });
    };
    SQLite.prototype.removeById = function (collection, id) {
        var _this = this;
        var queries = [
            ['SELECT value FROM #{collection} WHERE key = ?', [id]],
            ['DELETE FROM #{collection} WHERE key = ?', [id]],
        ];
        return this.openTransaction(collection, queries, null, true)
            .then(function (response) {
            var entities = response[0];
            var count = response[1];
            count = count || entities.length;
            if (count === 0) {
                throw new errors_1.NotFoundError("An entity with _id = " + id + " was not found in the " + collection
                    + (" collection on the " + _this.name + " SQLite database."));
            }
            return { count: count };
        });
    };
    SQLite.prototype.clear = function () {
        var _this = this;
        return this.openTransaction(masterCollectionName, 'SELECT name AS value FROM #{collection} WHERE type = ?', ['table'], false)
            .then(function (tables) {
            if (tables.length === 0) {
                return null;
            }
            var queries = tables
                .filter(function (table) { return (/^[a-zA-Z0-9-]{1,128}/).test(table); })
                .map(function (table) { return ["DROP TABLE IF EXISTS '" + table + "'"]; });
            return _this.openTransaction(masterCollectionName, queries, null, true);
        })
            .then(function () {
            return null;
        });
    };
    return SQLite;
}());
exports.default = {
    load: function (name) {
        var db = new SQLite(name);
        if (utils_1.isDefined(NativeScriptSQLite) === false) {
            return Promise.resolve(undefined);
        }
        if (utils_1.isDefined(isSupported)) {
            if (isSupported) {
                return Promise.resolve(db);
            }
            return Promise.resolve(undefined);
        }
        return db.save('__testSupport', { _id: '1' })
            .then(function () {
            isSupported = true;
            return db;
        })
            .catch(function () {
            isSupported = false;
            return undefined;
        });
    }
};
