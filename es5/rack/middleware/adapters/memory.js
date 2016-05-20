'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Memory = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../../errors');

var _fastMemoryCache = require('fast-memory-cache');

var _fastMemoryCache2 = _interopRequireDefault(_fastMemoryCache);

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(collection) {
        var entities;
        return regeneratorRuntime.wrap(function _callee$(_context) {
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
        return ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(collection, id) {
        var entities, entity;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
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
        return ref.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'save',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(collection, entities) {
        var singular, existingEntities, entityIds;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
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
        return ref.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'removeById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(collection, id) {
        var entities, entity;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
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
        return ref.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: 'clear',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
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
        return ref.apply(this, arguments);
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