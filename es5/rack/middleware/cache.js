'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheMiddleware = exports.DB = exports.DBAdapter = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-disable no-underscore-dangle */


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

var _request2 = require('../../requests/request');

var _response = require('../../requests/response');

var _promiseQueue = require('promise-queue');

var _promiseQueue2 = _interopRequireDefault(_promiseQueue);

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

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
_promiseQueue2.default.configure(Promise);
var queue = new _promiseQueue2.default(1, Infinity);

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
        _log.Log.error('Provided adapters are unsupported on this platform. ' + 'Defaulting to the Memory adapter.', adapters);
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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(collection, query) {
        var entities;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return this.adapter.find(collection);

              case 3:
                entities = _context.sent;

                if (entities) {
                  _context.next = 6;
                  break;
                }

                return _context.abrupt('return', []);

              case 6:

                if (query && !(query instanceof _query.Query)) {
                  query = new _query.Query((0, _result2.default)(query, 'toJSON', query));
                }

                if (entities.length > 0 && query) {
                  entities = query._process(entities);
                }

                return _context.abrupt('return', entities);

              case 11:
                _context.prev = 11;
                _context.t0 = _context['catch'](0);

                if (!(_context.t0 instanceof _errors.NotFoundError)) {
                  _context.next = 15;
                  break;
                }

                return _context.abrupt('return', []);

              case 15:
                throw _context.t0;

              case 16:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 11]]);
      }));

      function find(_x3, _x4) {
        return ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'count',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(collection, query) {
        var entities;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.find(collection, query);

              case 2:
                entities = _context2.sent;
                return _context2.abrupt('return', { count: entities.length });

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function count(_x5, _x6) {
        return ref.apply(this, arguments);
      }

      return count;
    }()
  }, {
    key: 'group',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(collection, aggregation) {
        var entities;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.find(collection);

              case 2:
                entities = _context3.sent;


                if (!(aggregation instanceof _aggregation.Aggregation)) {
                  aggregation = new _aggregation.Aggregation((0, _result2.default)(aggregation, 'toJSON', aggregation));
                }

                if (!(entities.length > 0 && aggregation)) {
                  _context3.next = 6;
                  break;
                }

                return _context3.abrupt('return', aggregation.process(entities));

              case 6:
                return _context3.abrupt('return', null);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function group(_x7, _x8) {
        return ref.apply(this, arguments);
      }

      return group;
    }()
  }, {
    key: 'findById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(collection, id) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;

                if ((0, _isString2.default)(id)) {
                  _context4.next = 3;
                  break;
                }

                throw new _errors.KinveyError('id must be a string', id);

              case 3:
                return _context4.abrupt('return', this.adapter.findById(collection, id));

              case 6:
                _context4.prev = 6;
                _context4.t0 = _context4['catch'](0);

                if (!(_context4.t0 instanceof _errors.NotFoundError)) {
                  _context4.next = 10;
                  break;
                }

                return _context4.abrupt('return', undefined);

              case 10:
                throw _context4.t0;

              case 11:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[0, 6]]);
      }));

      function findById(_x9, _x10) {
        return ref.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'save',
    value: function save(collection) {
      var _this2 = this;

      var entities = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      return queue.add(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
        var singular;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                singular = false;

                if (entities) {
                  _context5.next = 3;
                  break;
                }

                return _context5.abrupt('return', null);

              case 3:

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

                _context5.next = 7;
                return _this2.adapter.save(collection, entities);

              case 7:
                entities = _context5.sent;

                if (!(singular && entities.length > 0)) {
                  _context5.next = 10;
                  break;
                }

                return _context5.abrupt('return', entities[0]);

              case 10:
                return _context5.abrupt('return', entities);

              case 11:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, _this2);
      })));
    }
  }, {
    key: 'remove',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(collection, query) {
        var _this3 = this;

        var entities, responses;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (query && !(query instanceof _query.Query)) {
                  query = new _query.Query(query);
                }

                // Removing should not take the query sort, limit, and skip into account.
                if (query) {
                  query.sort = null;
                  query.limit = null;
                  query.skip = 0;
                }

                _context6.next = 4;
                return this.find(collection, query);

              case 4:
                entities = _context6.sent;
                _context6.next = 7;
                return Promise.all(entities.map(function (entity) {
                  return _this3.removeById(collection, entity[idAttribute]);
                }));

              case 7:
                responses = _context6.sent;
                return _context6.abrupt('return', (0, _reduce2.default)(responses, function (entities, entity) {
                  entities.push(entity);
                  return entities;
                }, []));

              case 9:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function remove(_x12, _x13) {
        return ref.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      var _this4 = this;

      return queue.add(function () {
        if (!id) {
          return undefined;
        }

        if (!(0, _isString2.default)(id)) {
          throw new _errors.KinveyError('id must be a string', id);
        }

        return _this4.adapter.removeById(collection, id);
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      var _this5 = this;

      return queue.add(function () {
        return _this5.adapter.clear();
      });
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

    var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheMiddleware).call(this, 'Kinvey Cache Middleware'));

    _this6.adapters = adapters;
    return _this6;
  }

  _createClass(CacheMiddleware, [{
    key: 'handle',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(request) {
        var _request, method, query, body, collection, entityId, db, data;

        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return _get(Object.getPrototypeOf(CacheMiddleware.prototype), 'handle', this).call(this, request);

              case 2:
                request = _context7.sent;
                _request = request;
                method = _request.method;
                query = _request.query;
                body = _request.body;
                collection = _request.collection;
                entityId = _request.entityId;
                db = new DB(request.appKey, this.adapters);
                data = void 0;

                if (!(method === _request2.RequestMethod.GET)) {
                  _context7.next = 35;
                  break;
                }

                if (!entityId) {
                  _context7.next = 30;
                  break;
                }

                if (!(entityId === '_count')) {
                  _context7.next = 19;
                  break;
                }

                _context7.next = 16;
                return db.count(collection, query);

              case 16:
                data = _context7.sent;
                _context7.next = 28;
                break;

              case 19:
                if (!(entityId === '_group')) {
                  _context7.next = 25;
                  break;
                }

                _context7.next = 22;
                return db.group(collection, body);

              case 22:
                data = _context7.sent;
                _context7.next = 28;
                break;

              case 25:
                _context7.next = 27;
                return db.findById(collection, request.entityId);

              case 27:
                data = _context7.sent;

              case 28:
                _context7.next = 33;
                break;

              case 30:
                _context7.next = 32;
                return db.find(collection, query);

              case 32:
                data = _context7.sent;

              case 33:
                _context7.next = 57;
                break;

              case 35:
                if (!(method === _request2.RequestMethod.POST || method === _request2.RequestMethod.PUT)) {
                  _context7.next = 41;
                  break;
                }

                _context7.next = 38;
                return db.save(collection, body);

              case 38:
                data = _context7.sent;
                _context7.next = 57;
                break;

              case 41:
                if (!(method === _request2.RequestMethod.DELETE)) {
                  _context7.next = 57;
                  break;
                }

                if (!(collection && entityId)) {
                  _context7.next = 48;
                  break;
                }

                _context7.next = 45;
                return db.removeById(collection, entityId);

              case 45:
                data = _context7.sent;
                _context7.next = 57;
                break;

              case 48:
                if (collection) {
                  _context7.next = 54;
                  break;
                }

                _context7.next = 51;
                return db.clear();

              case 51:
                data = _context7.sent;
                _context7.next = 57;
                break;

              case 54:
                _context7.next = 56;
                return db.remove(collection, query);

              case 56:
                data = _context7.sent;

              case 57:

                request.response = {
                  statusCode: method === _request2.RequestMethod.POST ? _response.StatusCode.Created : _response.StatusCode.Ok,
                  headers: {},
                  data: data
                };

                if (!data) {
                  request.response.statusCode = _response.StatusCode.Empty;
                }

                return _context7.abrupt('return', request);

              case 60:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function handle(_x15) {
        return ref.apply(this, arguments);
      }

      return handle;
    }()
  }]);

  return CacheMiddleware;
}(_middleware.KinveyMiddleware);