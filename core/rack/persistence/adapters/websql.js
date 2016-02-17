'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebSQL = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../../errors');

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var masterCollectionName = 'sqlite_master';
var size = 5 * 1000 * 1000; // Database size in bytes
var webSQL = null;
var dbCache = {};

if (typeof window !== 'undefined') {
  webSQL = {
    openDatabase: typeof openDatabase !== 'undefined' ? openDatabase : global.openDatabase
  };
}

/**
 * @private
 */

var WebSQL = exports.WebSQL = function () {
  function WebSQL() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'kinvey' : arguments[0];

    _classCallCheck(this, WebSQL);

    this.name = name;
  }

  _createClass(WebSQL, [{
    key: 'openTransaction',
    value: function openTransaction(collection, query, parameters) {
      var _this = this;

      var write = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

      var db = dbCache[this.name];
      var escapedCollection = '"' + collection + '"';
      var isMaster = collection === masterCollectionName;
      var isMulti = (0, _isArray2.default)(query);

      query = isMulti ? query : [[query, parameters]];

      if (!db) {
        db = webSQL.openDatabase(this.name, 1, '', size);
        dbCache[this.name] = db;
      }

      var promise = new Promise(function (resolve, reject) {
        var writeTxn = write || !(0, _isFunction2.default)(db.readTransaction);
        db[writeTxn ? 'transaction' : 'readTransaction'](function (tx) {
          if (write && !isMaster) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS ' + escapedCollection + ' ' + '(key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)');
          }

          var pending = query.length;
          var responses = [];

          (0, _forEach2.default)(query, function (parts) {
            var sql = parts[0].replace('#{collection}', escapedCollection);

            tx.executeSql(sql, parts[1], function (_, resultSet) {
              var response = {
                rowCount: resultSet.rowsAffected,
                result: []
              };

              if (resultSet.rows.length) {
                for (var i = 0, len = resultSet.rows.length; i < len; i++) {
                  try {
                    var value = resultSet.rows.item(i).value;
                    var entity = isMaster ? value : JSON.parse(value);
                    response.result.push(entity);
                  } catch (err) {
                    // Catch the error
                  }
                }
              }

              responses.push(response);
              pending = pending - 1;

              if (pending === 0) {
                resolve(isMulti ? responses : responses.shift());
              }
            });
          });
        }, function (err) {
          err = (0, _isString2.default)(err) ? err : err.message;

          if (err && err.indexOf('no such table') === -1) {
            return reject(new _errors.NotFoundError('The ' + collection + ' collection was not found on ' + ('the ' + _this.name + ' webSQL database.')));
          }

          var query = 'SELECT name AS value from #{collection} WHERE type = ? AND name = ?';
          var parameters = ['table', collection];

          _this.openTransaction(masterCollectionName, query, parameters).then(function (response) {
            if (response.result.length === 0) {
              return reject(new _errors.NotFoundError('The ' + collection + ' collection was not found on ' + ('the ' + _this.name + ' webSQL database.')));
            }

            reject(new _errors.KinveyError('Unable to open a transaction for the ' + collection + ' ' + ('collection on the ' + _this.name + ' webSQL database.')));
          }).catch(function (err) {
            reject(new _errors.KinveyError('Unable to open a transaction for the ' + collection + ' ' + ('collection on the ' + _this.name + ' webSQL database.'), err));
          });
        });
      });

      return promise;
    }
  }, {
    key: 'find',
    value: function find(collection) {
      var sql = 'SELECT value FROM #{collection}';
      var promise = this.openTransaction(collection, sql, []).then(function (response) {
        return response.result;
      }).catch(function (error) {
        if (error instanceof _errors.NotFoundError) {
          return [];
        }

        throw error;
      });
      return promise;
    }
  }, {
    key: 'findById',
    value: function findById(collection, id) {
      var _this2 = this;

      var sql = 'SELECT value FROM #{collection} WHERE key = ?';
      var promise = this.openTransaction(collection, sql, [id]).then(function (response) {
        var entities = response.result;

        if (entities.length === 0) {
          throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this2.name + ' webSQL database.'));
        }

        return entities[0];
      });
      return promise;
    }
  }, {
    key: 'save',
    value: function save(collection, entities) {
      var queries = [];
      entities = (0, _map2.default)(entities, function (entity) {
        queries.push(['REPLACE INTO #{collection} (key, value) VALUES (?, ?)', [entity[idAttribute], JSON.stringify(entity)]]);

        return entity;
      });

      var promise = this.openTransaction(collection, queries, null, true).then(function () {
        return entities;
      });
      return promise;
    }
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      var _this3 = this;

      var promise = this.openTransaction(collection, [['SELECT value FROM #{collection} WHERE key = ?', [id]], ['DELETE FROM #{collection} WHERE key = ?', [id]]], null, true).then(function (response) {
        var entities = response[0].result;
        var count = response[1].rowCount;
        count = count ? count : entities.length;

        if (count === 0) {
          throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this3.name + ' webSQL database.'));
        }

        return {
          count: 1,
          entities: entities
        };
      });

      return promise;
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return webSQL ? true : false;
    }
  }]);

  return WebSQL;
}();