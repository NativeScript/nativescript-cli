'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheMiddleware = exports.DB = exports.DBAdapter = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _query = require('../../query');

var _aggregation = require('../../aggregation');

var _indexeddb = require('./adapters/indexeddb');

var _indexeddb2 = _interopRequireDefault(_indexeddb);

var _localstorage = require('./adapters/localstorage');

var _memory = require('./adapters/memory');

var _websql = require('./adapters/websql');

var _errors = require('../../errors');

var _log = require('../../log');

var _middleware = require('../middleware');

var _enums = require('../../enums');

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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

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
          if (_indexeddb2.default.isSupported()) {
            _this.adapter = new _indexeddb2.default(name);
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
      return this.find(collection, query).then(function (entities) {
        var data = { count: entities.length };
        return data;
      });
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
        return Promise.reject(new _errors.KinveyError('id must be a string', id));
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
        return Promise.resolve(null);
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
        return Promise.all(promises);
      }).then(function (responses) {
        var result = (0, _reduce2.default)(responses, function (allEntities, entities) {
          allEntities = allEntities.concat(entities);
          return allEntities;
        }, []);
        return result;
      });

      return promise;
    }
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      if (!id) {
        return Promise.resolve(null);
      }

      if (!(0, _isString2.default)(id)) {
        return Promise.reject(new _errors.KinveyError('id must be a string', id));
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

/**
 * @private
 */


var CacheMiddleware = exports.CacheMiddleware = function (_KinveyMiddleware) {
  _inherits(CacheMiddleware, _KinveyMiddleware);

  function CacheMiddleware() {
    var adapters = arguments.length <= 0 || arguments[0] === undefined ? [DBAdapter.IndexedDB, DBAdapter.WebSQL, DBAdapter.LocalStorage, DBAdapter.Memory] : arguments[0];

    _classCallCheck(this, CacheMiddleware);

    var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheMiddleware).call(this, 'Kinvey Cache Middleware'));

    _this4.adapters = adapters;
    return _this4;
  }

  _createClass(CacheMiddleware, [{
    key: 'handle',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(request) {
        var method, query, body, db, data;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _get(Object.getPrototypeOf(CacheMiddleware.prototype), 'handle', this).call(this, request);

              case 2:
                request = _context.sent;
                method = request.method;
                query = request.query;
                body = request.body;
                db = new DB(request.appKey, this.adapters);
                data = void 0;

                if (!(method === _enums.RequestMethod.GET)) {
                  _context.next = 32;
                  break;
                }

                if (!request.entityId) {
                  _context.next = 27;
                  break;
                }

                if (!(request.entityId === '_count')) {
                  _context.next = 16;
                  break;
                }

                _context.next = 13;
                return db.count(request.collectionName, query);

              case 13:
                data = _context.sent;
                _context.next = 25;
                break;

              case 16:
                if (!(request.entityId === '_group')) {
                  _context.next = 22;
                  break;
                }

                _context.next = 19;
                return db.group(request.collectionName, body);

              case 19:
                data = _context.sent;
                _context.next = 25;
                break;

              case 22:
                _context.next = 24;
                return db.findById(request.collectionName, request.entityId);

              case 24:
                data = _context.sent;

              case 25:
                _context.next = 30;
                break;

              case 27:
                _context.next = 29;
                return db.find(request.collectionName, query);

              case 29:
                data = _context.sent;

              case 30:
                _context.next = 48;
                break;

              case 32:
                if (!(method === _enums.RequestMethod.POST || method === _enums.RequestMethod.PUT)) {
                  _context.next = 38;
                  break;
                }

                _context.next = 35;
                return db.save(request.collectionName, body);

              case 35:
                data = _context.sent;
                _context.next = 48;
                break;

              case 38:
                if (!(method === _enums.RequestMethod.DELETE)) {
                  _context.next = 48;
                  break;
                }

                if (!request.entityId) {
                  _context.next = 45;
                  break;
                }

                _context.next = 42;
                return db.removeById(request.collectionName, request.entityId);

              case 42:
                data = _context.sent;
                _context.next = 48;
                break;

              case 45:
                _context.next = 47;
                return db.remove(request.collectionName, query);

              case 47:
                data = _context.sent;

              case 48:

                request.response = {
                  statusCode: method === _enums.RequestMethod.POST ? _enums.StatusCode.Created : _enums.StatusCode.Ok,
                  headers: {},
                  data: data
                };

                return _context.abrupt('return', request);

              case 50:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function handle(_x5) {
        return ref.apply(this, arguments);
      }

      return handle;
    }()
  }]);

  return CacheMiddleware;
}(_middleware.KinveyMiddleware);