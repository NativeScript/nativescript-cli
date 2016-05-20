'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../../errors');

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _merge = require('lodash/merge');

var _merge2 = _interopRequireDefault(_merge);

var _values = require('lodash/values');

var _values2 = _interopRequireDefault(_values);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _findIndex = require('lodash/findIndex');

var _findIndex2 = _interopRequireDefault(_findIndex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var masterCollectionName = 'master';
var localStorage = global.localStorage;

/**
 * @private
 */

var LocalStorage = exports.LocalStorage = function () {
  function LocalStorage() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'kinvey' : arguments[0];

    _classCallCheck(this, LocalStorage);

    this.name = name;
  }

  _createClass(LocalStorage, [{
    key: 'find',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(collection) {
        var entities;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                entities = localStorage.getItem('' + this.name + collection);

                if (!entities) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt('return', JSON.parse(entities));

              case 3:
                return _context.abrupt('return', entities);

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x2) {
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
                entity = find(entities, function (entity) {
                  return entity[idAttribute] === id;
                });

                if (entity) {
                  _context2.next = 6;
                  break;
                }

                throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + (' collection on the ' + this.name + ' localstorage database.'));

              case 6:
                return _context2.abrupt('return', entity);

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function findById(_x3, _x4) {
        return ref.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'save',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(collection, entities) {
        var collections, existingEntities, existingEntitiesById, entitiesById, existingEntityIds;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.find(masterCollectionName);

              case 2:
                collections = _context3.sent;


                if ((0, _findIndex2.default)(collections, collection) === -1) {
                  collections.push(collection);
                  localStorage.setItem('' + this.name + masterCollectionName, JSON.stringify(collections));
                }

                _context3.next = 6;
                return this.find(collection);

              case 6:
                existingEntities = _context3.sent;
                existingEntitiesById = (0, _keyBy2.default)(existingEntities, idAttribute);
                entitiesById = (0, _keyBy2.default)(entities, idAttribute);
                existingEntityIds = Object.keys(existingEntitiesById);


                (0, _forEach2.default)(existingEntityIds, function (id) {
                  var existingEntity = existingEntitiesById[id];
                  var entity = entitiesById[id];

                  if (entity) {
                    entitiesById[id] = (0, _merge2.default)(existingEntity, entity);
                  }
                });

                localStorage.setItem('' + this.name + collection, JSON.stringify((0, _values2.default)(entitiesById)));
                return _context3.abrupt('return', entities);

              case 13:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function save(_x5, _x6) {
        return ref.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'removeById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(collection, id) {
        var entities, entitiesById, entity;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.find(collection);

              case 2:
                entities = _context4.sent;
                entitiesById = (0, _keyBy2.default)(entities, idAttribute);
                entity = entitiesById[id];

                if (entity) {
                  _context4.next = 7;
                  break;
                }

                throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + this.name + ' memory database.'));

              case 7:

                delete entitiesById[id];
                localStorage.setItem('' + this.name + collection, JSON.stringify((0, _values2.default)(entitiesById)));

                return _context4.abrupt('return', entity);

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function removeById(_x7, _x8) {
        return ref.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: 'clear',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
        var _this = this;

        var collections;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.find(masterCollectionName);

              case 2:
                collections = _context5.sent;


                (0, _forEach2.default)(collections, function (collection) {
                  localStorage.removeItem('' + _this.name + collection);
                });

              case 4:
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
      if (localStorage) {
        var item = 'testLocalStorageSupport';
        try {
          localStorage.setItem(item, item);
          localStorage.removeItem(item);
          return true;
        } catch (e) {
          return false;
        }
      }

      return false;
    }
  }]);

  return LocalStorage;
}();