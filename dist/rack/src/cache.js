'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheMiddleware = exports.DB = exports.Memory = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable-line no-unused-vars


var _query = require('../../query');

var _aggregation = require('../../aggregation');

var _middleware = require('./middleware');

var _errors = require('../../errors');

var _es6Promise = require('es6-promise');

var _fastMemoryCache = require('fast-memory-cache');

var _fastMemoryCache2 = _interopRequireDefault(_fastMemoryCache);

var _promiseQueue = require('promise-queue');

var _promiseQueue2 = _interopRequireDefault(_promiseQueue);

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _values = require('lodash/values');

var _values2 = _interopRequireDefault(_values);

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _es6Promise.Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _es6Promise.Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
_promiseQueue2.default.configure(_es6Promise.Promise);
var queue = new _promiseQueue2.default(1, Infinity);
var dbCache = {};
var caches = [];

/**
 * @private
 */

var Memory = exports.Memory = function () {
  function Memory(name) {
    _classCallCheck(this, Memory);

    if (!name) {
      throw new _errors.KinveyError('A name for the collection is required to use the memory persistence adapter.', name);
    }

    if (!(0, _isString2.default)(name)) {
      throw new _errors.KinveyError('The name of the collection must be a string to use the memory persistence adapter', name);
    }

    this.name = name;
    this.cache = caches[name];

    if (!this.cache) {
      this.cache = new _fastMemoryCache2.default();
      caches[name] = this.cache;
    }
  }

  _createClass(Memory, [{
    key: 'find',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(collection) {
        var entities;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                entities = this.cache.get(collection);

                if (!entities) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt('return', JSON.parse(entities));

              case 3:
                return _context.abrupt('return', []);

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x) {
        return _ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findById',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2(collection, id) {
        var entities, entity;
        return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.find(collection);

              case 2:
                entities = _context2.sent;
                entity = (0, _find2.default)(entities, function (entity) {
                  return entity[idAttribute] === id;
                });

                if (entity) {
                  _context2.next = 6;
                  break;
                }

                throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + (' collection on the ' + this.name + ' memory database.'));

              case 6:
                return _context2.abrupt('return', entity);

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function findById(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(collection, entities) {
        var singular, existingEntities, entityIds;
        return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                singular = false;


                if (!(0, _isArray2.default)(entities)) {
                  entities = [entities];
                  singular = true;
                }

                if (!(entities.length === 0)) {
                  _context3.next = 4;
                  break;
                }

                return _context3.abrupt('return', entities);

              case 4:
                _context3.next = 6;
                return this.find(collection);

              case 6:
                existingEntities = _context3.sent;

                existingEntities = (0, _keyBy2.default)(existingEntities, idAttribute);
                entities = (0, _keyBy2.default)(entities, idAttribute);
                entityIds = Object.keys(entities);


                (0, _forEach2.default)(entityIds, function (id) {
                  existingEntities[id] = entities[id];
                });

                this.cache.set(collection, JSON.stringify((0, _values2.default)(existingEntities)));

                entities = (0, _values2.default)(entities);
                return _context3.abrupt('return', singular ? entities[0] : entities);

              case 14:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function save(_x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'removeById',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee4(collection, id) {
        var entities, entity;
        return _regeneratorRuntime2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.find(collection);

              case 2:
                entities = _context4.sent;

                entities = (0, _keyBy2.default)(entities, idAttribute);
                entity = entities[id];

                if (entity) {
                  _context4.next = 7;
                  break;
                }

                throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + (' collection on the ' + this.name + ' memory database.'));

              case 7:

                delete entities[id];
                this.cache.set(collection, JSON.stringify((0, _values2.default)(entities)));

                return _context4.abrupt('return', entity);

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function removeById(_x6, _x7) {
        return _ref4.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: 'clear',
    value: function () {
      var _ref5 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee5() {
        return _regeneratorRuntime2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                this.cache.clear();
                return _context5.abrupt('return', null);

              case 2:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function clear() {
        return _ref5.apply(this, arguments);
      }

      return clear;
    }()
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return true;
    }
  }]);

  return Memory;
}();

/**
 * @private
 */


var DB = exports.DB = function () {
  function DB(name) {
    _classCallCheck(this, DB);

    if (!name) {
      throw new _errors.KinveyError('Unable to create a DB instance without a name.');
    }

    if (!(0, _isString2.default)(name)) {
      throw new _errors.KinveyError('The name is not a string. A name must be a string to create a DB instance.');
    }

    this.adapter = new Memory(name);
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

      return objectId;
    }
  }, {
    key: 'find',
    value: function () {
      var _ref6 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee6(collection, query) {
        var entities;
        return _regeneratorRuntime2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.prev = 0;
                _context6.next = 3;
                return this.adapter.find(collection);

              case 3:
                entities = _context6.sent;

                if (entities) {
                  _context6.next = 6;
                  break;
                }

                return _context6.abrupt('return', []);

              case 6:

                if (query && !(query instanceof _query.Query)) {
                  query = new _query.Query((0, _result2.default)(query, 'toJSON', query));
                }

                if (entities.length > 0 && query) {
                  entities = query.process(entities);
                }

                return _context6.abrupt('return', entities);

              case 11:
                _context6.prev = 11;
                _context6.t0 = _context6['catch'](0);

                if (!(_context6.t0 instanceof _errors.NotFoundError)) {
                  _context6.next = 15;
                  break;
                }

                return _context6.abrupt('return', []);

              case 15:
                throw _context6.t0;

              case 16:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[0, 11]]);
      }));

      function find(_x9, _x10) {
        return _ref6.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findById',
    value: function () {
      var _ref7 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee7(collection, id) {
        return _regeneratorRuntime2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if ((0, _isString2.default)(id)) {
                  _context7.next = 2;
                  break;
                }

                throw new _errors.KinveyError('id must be a string', id);

              case 2:
                return _context7.abrupt('return', this.adapter.findById(collection, id));

              case 3:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function findById(_x11, _x12) {
        return _ref7.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'count',
    value: function () {
      var _ref8 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee8(collection, query) {
        var entities;
        return _regeneratorRuntime2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.find(collection, query);

              case 2:
                entities = _context8.sent;
                return _context8.abrupt('return', { count: entities.length });

              case 4:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function count(_x13, _x14) {
        return _ref8.apply(this, arguments);
      }

      return count;
    }()
  }, {
    key: 'group',
    value: function () {
      var _ref9 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee9(collection, aggregation) {
        var entities;
        return _regeneratorRuntime2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.find(collection);

              case 2:
                entities = _context9.sent;


                if (!(aggregation instanceof _aggregation.Aggregation)) {
                  aggregation = new _aggregation.Aggregation((0, _result2.default)(aggregation, 'toJSON', aggregation));
                }

                if (!(entities.length > 0 && aggregation)) {
                  _context9.next = 6;
                  break;
                }

                return _context9.abrupt('return', aggregation.process(entities));

              case 6:
                return _context9.abrupt('return', null);

              case 7:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function group(_x15, _x16) {
        return _ref9.apply(this, arguments);
      }

      return group;
    }()
  }, {
    key: 'save',
    value: function save(collection) {
      var _this = this;

      var entities = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      return queue.add(_asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee10() {
        var singular;
        return _regeneratorRuntime2.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                singular = false;

                if (entities) {
                  _context10.next = 3;
                  break;
                }

                return _context10.abrupt('return', null);

              case 3:

                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                entities = (0, _map2.default)(entities, function (entity) {
                  var id = entity[idAttribute];
                  var kmd = entity[kmdAttribute] || {};

                  if (!id) {
                    id = _this.generateObjectId();
                    kmd.local = true;
                  }

                  entity[idAttribute] = id;
                  entity[kmdAttribute] = kmd;
                  return entity;
                });

                _context10.next = 7;
                return _this.adapter.save(collection, entities);

              case 7:
                entities = _context10.sent;

                if (!(singular && entities.length > 0)) {
                  _context10.next = 10;
                  break;
                }

                return _context10.abrupt('return', entities[0]);

              case 10:
                return _context10.abrupt('return', entities);

              case 11:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, _this);
      })));
    }
  }, {
    key: 'remove',
    value: function () {
      var _ref11 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee11(collection, query) {
        var _this2 = this;

        var entities, responses;
        return _regeneratorRuntime2.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
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

                _context11.next = 4;
                return this.find(collection, query);

              case 4:
                entities = _context11.sent;
                _context11.next = 7;
                return _es6Promise.Promise.all(entities.map(function (entity) {
                  return _this2.removeById(collection, entity[idAttribute]);
                }));

              case 7:
                responses = _context11.sent;
                return _context11.abrupt('return', (0, _reduce2.default)(responses, function (entities, entity) {
                  entities.push(entity);
                  return entities;
                }, []));

              case 9:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function remove(_x18, _x19) {
        return _ref11.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      var _this3 = this;

      return queue.add(function () {
        if (!id) {
          return undefined;
        }

        if (!(0, _isString2.default)(id)) {
          throw new _errors.KinveyError('id must be a string', id);
        }

        return _this3.adapter.removeById(collection, id);
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      var _this4 = this;

      return queue.add(function () {
        return _this4.adapter.clear();
      });
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
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Cache Middleware' : arguments[0];

    _classCallCheck(this, CacheMiddleware);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(CacheMiddleware).call(this, name));
  }

  _createClass(CacheMiddleware, [{
    key: 'openDatabase',
    value: function openDatabase(name) {
      if (!name) {
        throw new _errors.KinveyError('A name is required to open a database.');
      }

      var db = dbCache[name];

      if (!db) {
        db = new DB(name);
      }

      return db;
    }
  }, {
    key: 'handle',
    value: function () {
      var _ref12 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee12(request) {
        var method, query, body, appKey, collection, entityId, client, db, data, response;
        return _regeneratorRuntime2.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                method = request.method;
                query = request.query;
                body = request.body;
                appKey = request.appKey;
                collection = request.collection;
                entityId = request.entityId;
                client = request.client;
                db = this.openDatabase(appKey, client ? client.encryptionKey : undefined);
                data = void 0;

                if (!(method === 'GET')) {
                  _context12.next = 33;
                  break;
                }

                if (!entityId) {
                  _context12.next = 28;
                  break;
                }

                if (!(entityId === '_count')) {
                  _context12.next = 17;
                  break;
                }

                _context12.next = 14;
                return db.count(collection, query);

              case 14:
                data = _context12.sent;
                _context12.next = 26;
                break;

              case 17:
                if (!(entityId === '_group')) {
                  _context12.next = 23;
                  break;
                }

                _context12.next = 20;
                return db.group(collection, body);

              case 20:
                data = _context12.sent;
                _context12.next = 26;
                break;

              case 23:
                _context12.next = 25;
                return db.findById(collection, request.entityId);

              case 25:
                data = _context12.sent;

              case 26:
                _context12.next = 31;
                break;

              case 28:
                _context12.next = 30;
                return db.find(collection, query);

              case 30:
                data = _context12.sent;

              case 31:
                _context12.next = 55;
                break;

              case 33:
                if (!(method === 'POST' || method === 'PUT')) {
                  _context12.next = 39;
                  break;
                }

                _context12.next = 36;
                return db.save(collection, body);

              case 36:
                data = _context12.sent;
                _context12.next = 55;
                break;

              case 39:
                if (!(method === 'DELETE')) {
                  _context12.next = 55;
                  break;
                }

                if (!(collection && entityId)) {
                  _context12.next = 46;
                  break;
                }

                _context12.next = 43;
                return db.removeById(collection, entityId);

              case 43:
                data = _context12.sent;
                _context12.next = 55;
                break;

              case 46:
                if (collection) {
                  _context12.next = 52;
                  break;
                }

                _context12.next = 49;
                return db.clear();

              case 49:
                data = _context12.sent;
                _context12.next = 55;
                break;

              case 52:
                _context12.next = 54;
                return db.remove(collection, query);

              case 54:
                data = _context12.sent;

              case 55:
                response = {
                  statusCode: method === 'POST' ? 201 : 200,
                  headers: {},
                  data: data
                };


                if (!data || (0, _isEmpty2.default)(data)) {
                  response.statusCode = 204;
                }

                return _context12.abrupt('return', { response: response });

              case 58:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function handle(_x21) {
        return _ref12.apply(this, arguments);
      }

      return handle;
    }()
  }]);

  return CacheMiddleware;
}(_middleware.KinveyMiddleware);