'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DB = exports.DBAdapter = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _query = require('../../query');

var _aggregation = require('../../aggregation');

var _indexeddb = require('./adapters/indexeddb');

var _localstorage = require('./adapters/localstorage');

var _memory = require('./adapters/memory');

var _websql = require('./adapters/websql');

var _errors = require('../../errors');

var _log = require('../../log');

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = '_id' || '_id';
var kmdAttribute = '_kmd' || '_kmd';

/**
 * @private
 * Enum for DB Adapters.
 */
var DBAdapter = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  Memory: 'Memory',
  WebSQL: 'WebSQL'
};
Object.freeze(DBAdapter);
exports.DBAdapter = DBAdapter;

/**
 * @private
 */

var DB = exports.DB = function () {
  function DB(name) {
    var _this = this;

    var adapters = arguments.length <= 1 || arguments[1] === undefined ? [DBAdapter.IndexedDB, DBAdapter.WebSQL, DBAdapter.LocalStorage, DBAdapter.Memory] : arguments[1];

    _classCallCheck(this, DB);

    if (!(0, _isArray2.default)(adapters)) {
      adapters = [adapters];
    }

    (0, _forEach2.default)(adapters, function (adapter) {
      switch (adapter) {
        case DBAdapter.IndexedDB:
          if (_indexeddb.IndexedDB.isSupported()) {
            _this.adapter = new _indexeddb.IndexedDB(name);
            return false;
          }

          break;
        case DBAdapter.LocalStorage:
          if (_localstorage.LocalStorage.isSupported()) {
            _this.adapter = new _localstorage.LocalStorage(name);
            return false;
          }

          break;
        case DBAdapter.Memory:
          if (_memory.Memory.isSupported()) {
            _this.adapter = new _memory.Memory(name);
            return false;
          }

          break;
        case DBAdapter.WebSQL:
          if (_websql.WebSQL.isSupported()) {
            _this.adapter = new _websql.WebSQL(name);
            return false;
          }

          break;
        default:
          _log.Log.warn('The ' + adapter + ' adapter is is not recognized.');
      }

      return true;
    });

    if (!this.adapter) {
      if (_memory.Memory.isSupported()) {
        _log.Log.error('Provided adapters are unsupported on this platform. ' + 'Defaulting to StoreAdapter.Memory adapter.', adapters);
        this.adapter = new _memory.Memory(name);
      } else {
        _log.Log.error('Provided adapters are unsupported on this platform.', adapters);
      }
    }
  }

  _createClass(DB, [{
    key: 'generateObjectId',
    value: function generateObjectId() {
      var length = arguments.length <= 0 || arguments[0] === undefined ? 24 : arguments[0];

      var chars = 'abcdef0123456789';
      var objectId = '';

      for (var i = 0, j = chars.length; i < length; i++) {
        var pos = Math.floor(Math.random() * j);
        objectId += chars.substring(pos, pos + 1);
      }

      objectId = '' + this.objectIdPrefix + objectId;
      return objectId;
    }
  }, {
    key: 'find',
    value: function find(collection, query) {
      var promise = this.adapter.find(collection).then(function (entities) {
        if (!entities) {
          return [];
        }

        return entities;
      }).then(function (entities) {
        if (query && !(query instanceof _query.Query)) {
          query = new _query.Query((0, _result2.default)(query, 'toJSON', query));
        }

        if (entities.length > 0 && query) {
          entities = query._process(entities);
        }

        return entities;
      });

      return promise;
    }
  }, {
    key: 'count',
    value: function count(collection, query) {
      var promise = this.find(collection, query).then(function (entities) {
        return entities.length;
      });
      return promise;
    }
  }, {
    key: 'group',
    value: function group(collection, aggregation) {
      var promise = this.find(collection).then(function (entities) {
        if (!(aggregation instanceof _aggregation.Aggregation)) {
          aggregation = new _aggregation.Aggregation((0, _result2.default)(aggregation, 'toJSON', aggregation));
        }

        if (entities.length > 0 && aggregation) {
          return aggregation.process(entities);
        }

        return null;
      });

      return promise;
    }
  }, {
    key: 'findById',
    value: function findById(collection, id) {
      if (!(0, _isString2.default)(id)) {
        return _babybird2.default.reject(new _errors.KinveyError('id must be a string', id));
      }

      var promise = this.adapter.findById(collection, id);
      return promise;
    }
  }, {
    key: 'save',
    value: function save(collection) {
      var _this2 = this;

      var entities = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      var singular = false;

      if (!entities) {
        return _babybird2.default.resolve(null);
      }

      if (!(0, _isArray2.default)(entities)) {
        singular = true;
        entities = [entities];
      }

      entities = (0, _map2.default)(entities, function (entity) {
        var id = entity[idAttribute];
        var kmd = entity[kmdAttribute] || {};

        if (!id) {
          id = _this2.generateObjectId();
          kmd.local = true;
        }

        entity[idAttribute] = id;
        entity[kmdAttribute] = kmd;
        return entity;
      });

      return this.adapter.save(collection, entities).then(function (entities) {
        if (singular && entities.length > 0) {
          return entities[0];
        }

        return entities;
      });
    }
  }, {
    key: 'remove',
    value: function remove(collection, query) {
      var _this3 = this;

      if (query && !(query instanceof _query.Query)) {
        query = new _query.Query((0, _result2.default)(query, 'toJSON', query));
      }

      // Removing should not take the query sort, limit, and skip into account.
      if (query) {
        query.sort = null;
        query.limit = null;
        query.skip = 0;
      }

      var promise = this.find(collection, query).then(function (entities) {
        var promises = entities.map(function (entity) {
          return _this3.removeById(collection, entity[idAttribute]);
        });
        return _babybird2.default.all(promises);
      }).then(function (responses) {
        var result = (0, _reduce2.default)(responses, function (result, response) {
          result.count += response.count;
          result.entities = result.entities.concat(response.entities);
          return result;
        }, {
          count: 0,
          entities: []
        });
        return result;
      });

      return promise;
    }
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      if (!id) {
        return _babybird2.default.resolve({
          count: 0,
          entities: []
        });
      }

      if (!(0, _isString2.default)(id)) {
        return _babybird2.default.reject(new _errors.KinveyError('id must be a string', id));
      }

      var promise = this.adapter.removeById(collection, id);
      return promise;
    }
  }, {
    key: 'objectIdPrefix',
    get: function get() {
      return '';
    }
  }]);

  return DB;
}();