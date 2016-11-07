'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _fastMemoryCache = require('fast-memory-cache');

var _fastMemoryCache2 = _interopRequireDefault(_fastMemoryCache);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process && process.env && process.env.KINVEY_ID_ATTRIBUTE || undefined || '_id';
var caches = {};

var Memory = function () {
  function Memory(name) {
    _classCallCheck(this, Memory);

    if (!name) {
      throw new Error('A name for the collection is required to use the memory persistence adapter.', name);
    }

    if (!(0, _isString2.default)(name)) {
      throw new Error('The name of the collection must be a string to use the memory persistence adapter', name);
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
    value: function find(collection) {
      try {
        var entities = this.cache.get(collection);

        if (entities) {
          return _es6Promise2.default.resolve(JSON.parse(entities));
        }

        return _es6Promise2.default.resolve([]);
      } catch (error) {
        return _es6Promise2.default.reject(error);
      }
    }
  }, {
    key: 'findById',
    value: function findById(collection, id) {
      var _this = this;

      return this.find(collection).then(function (entities) {
        var entity = (0, _find2.default)(entities, function (entity) {
          return entity[idAttribute] === id;
        });

        if (!entity) {
          throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + (' collection on the ' + _this.name + ' memory database.'));
        }

        return entity;
      });
    }
  }, {
    key: 'save',
    value: function save(collection, entities) {
      var _this2 = this;

      var singular = false;

      if (!(0, _isArray2.default)(entities)) {
        entities = [entities];
        singular = true;
      }

      if (entities.length === 0) {
        return _es6Promise2.default.resolve(entities);
      }

      return this.find(collection).then(function (existingEntities) {
        existingEntities = (0, _keyBy2.default)(existingEntities, idAttribute);
        entities = (0, _keyBy2.default)(entities, idAttribute);
        var entityIds = Object.keys(entities);

        (0, _forEach2.default)(entityIds, function (id) {
          existingEntities[id] = entities[id];
        });

        _this2.cache.set(collection, JSON.stringify((0, _values2.default)(existingEntities)));

        entities = (0, _values2.default)(entities);
        return singular ? entities[0] : entities;
      });
    }
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      var _this3 = this;

      return this.find(collection).then(function (entities) {
        entities = (0, _keyBy2.default)(entities, idAttribute);
        var entity = entities[id];

        if (!entity) {
          throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + (' collection on the ' + _this3.name + ' memory database.'));
        }

        delete entities[id];
        _this3.cache.set(collection, JSON.stringify((0, _values2.default)(entities)));

        return entity;
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.cache.clear();
      return _es6Promise2.default.resolve(null);
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return true;
    }
  }]);

  return Memory;
}();

exports.default = Memory;