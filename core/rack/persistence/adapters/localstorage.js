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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var localStorage = undefined;

if (typeof window !== 'undefined') {
  localStorage = window.localStorage;
}

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
    value: function find(collection) {
      var _this = this;

      return Promise.resolve().then(function () {
        var data = localStorage.getItem('' + _this.name + collection);

        try {
          return JSON.parse(data);
        } catch (err) {
          return data;
        }
      }).then(function (entities) {
        if (!entities) {
          return [];
        }

        return entities;
      });
    }
  }, {
    key: 'findById',
    value: function findById(collection, id) {
      var _this2 = this;

      return this.find(collection).then(function (entities) {
        var entity = find(entities, function (entity) {
          return entity[idAttribute] === id;
        });

        if (!entity) {
          throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this2.name + ' memory database.'));
        }

        return entity;
      });
    }
  }, {
    key: 'save',
    value: function save(collection, entities) {
      var _this3 = this;

      return this.find(collection).then(function (existingEntities) {
        var existingEntitiesById = (0, _keyBy2.default)(existingEntities, idAttribute);
        var entitiesById = (0, _keyBy2.default)(entities, idAttribute);

        for (var id in existingEntitiesById) {
          if (existingEntitiesById.hasOwnProperty(id)) {
            var existingEntity = existingEntitiesById[id];
            var entity = entitiesById[id];

            if (entity) {
              entitiesById[id] = (0, _merge2.default)(existingEntity, entity);
            }
          }
        }

        localStorage.setItem('' + _this3.name + collection, JSON.stringify((0, _values2.default)(entitiesById)));
        return entities;
      });
    }
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      var _this4 = this;

      return this.find(collection).then(function (entities) {
        var entitiesById = (0, _keyBy2.default)(entities, idAttribute);
        var entity = entitiesById[id];

        if (!entity) {
          throw new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this4.name + ' memory database.'));
        }

        delete entitiesById[id];
        localStorage.setItem('' + _this4.name + collection, JSON.stringify((0, _values2.default)(entitiesById)));

        return {
          count: 1,
          entities: [entity]
        };
      });
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      var item = 'testLocalStorageSupport';
      try {
        localStorage.setItem(item, item);
        localStorage.removeItem(item);
        return true;
      } catch (e) {
        return false;
      }
    }
  }]);

  return LocalStorage;
}();