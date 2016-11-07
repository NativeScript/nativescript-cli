'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./src/errors');

var _memory = require('./src/memory');

var _memory2 = _interopRequireDefault(_memory);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _promiseQueue = require('promise-queue');

var _promiseQueue2 = _interopRequireDefault(_promiseQueue);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_promiseQueue2.default.configure(_es6Promise2.default);
var queue = new _promiseQueue2.default(1, Infinity);

var StorageAdapter = {
  Memory: 'Memory'
};
Object.freeze(StorageAdapter);

var Storage = function () {
  function Storage(name) {
    _classCallCheck(this, Storage);

    if (!name) {
      throw new Error('Unable to create a Storage instance without a name.');
    }

    if (!(0, _isString2.default)(name)) {
      throw new Error('The name is not a string. A name must be a string to create a Storage instance.');
    }

    this.name = name;
  }

  _createClass(Storage, [{
    key: 'generateObjectId',
    value: function generateObjectId() {
      var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 24;

      var chars = 'abcdef0123456789';
      var objectId = '';

      for (var i = 0, j = chars.length; i < length; i += 1) {
        var pos = Math.floor(Math.random() * j);
        objectId += chars.substring(pos, pos + 1);
      }

      return objectId;
    }
  }, {
    key: 'find',
    value: function find(collection) {
      return this.adapter.find(collection).catch(function (error) {
        if (error instanceof _errors.NotFoundError || error.code === 404) {
          return [];
        }

        throw error;
      }).then(function () {
        var entities = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        return entities;
      });
    }
  }, {
    key: 'findById',
    value: function findById(collection, id) {
      if (!(0, _isString2.default)(id)) {
        return _es6Promise2.default.reject(new Error('id must be a string', id));
      }

      return this.adapter.findById(collection, id);
    }
  }, {
    key: 'save',
    value: function save(collection) {
      var _this = this;

      var entities = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      return queue.add(function () {
        var singular = false;

        if (!entities) {
          return _es6Promise2.default.resolve(null);
        }

        if (!(0, _isArray2.default)(entities)) {
          singular = true;
          entities = [entities];
        }

        entities = entities.map(function (entity) {
          var id = entity._id;
          var kmd = entity._kmd || {};

          if (!id) {
            id = _this.generateObjectId();
            kmd.local = true;
          }

          entity._id = id;
          entity._kmd = kmd;
          return entity;
        });

        return _this.adapter.save(collection, entities).then(function (entities) {
          if (singular && entities.length > 0) {
            return entities[0];
          }

          return entities;
        });
      });
    }
  }, {
    key: 'remove',
    value: function remove(collection) {
      var _this2 = this;

      var entities = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      return _es6Promise2.default.all(entities.map(function (entity) {
        if (typeof entity._id === 'undefined') {
          return _es6Promise2.default.reject('Unable to remove an entity because it does not have _id.');
        }

        return _this2.removeById(collection, entity._id);
      })).then(function (responses) {
        return responses.reduce(function (entities, entity) {
          entities.push(entity);
          return entities;
        }, []);
      });
    }
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      var _this3 = this;

      return queue.add(function () {
        if (!(0, _isString2.default)(id)) {
          return _es6Promise2.default.reject(new Error('id must be a string', id));
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
  }, {
    key: 'adapter',
    get: function get() {
      if (_memory2.default.isSupported()) {
        return new _memory2.default(this.name);
      }

      throw new Error('No storage adapter is available.');
    }
  }]);

  return Storage;
}();

exports.default = Storage;