'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheMiddleware = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _middleware = require('../middleware');

var _db = require('../persistence/db');

var _enums = require('../../enums');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 */

var CacheMiddleware = exports.CacheMiddleware = function (_KinveyMiddleware) {
  _inherits(CacheMiddleware, _KinveyMiddleware);

  function CacheMiddleware() {
    var adapters = arguments.length <= 0 || arguments[0] === undefined ? [_db.DBAdapter.IndexedDB, _db.DBAdapter.WebSQL, _db.DBAdapter.LocalStorage, _db.DBAdapter.Memory] : arguments[0];

    _classCallCheck(this, CacheMiddleware);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheMiddleware).call(this, 'Kinvey Cache Middleware'));

    _this.adapters = adapters;
    return _this;
  }

  _createClass(CacheMiddleware, [{
    key: 'handle',
    value: function handle(request) {
      var _this2 = this;

      return _get(Object.getPrototypeOf(CacheMiddleware.prototype), 'handle', this).call(this, request).then(function (_ref) {
        var appKey = _ref.appKey;
        var collection = _ref.collection;
        var id = _ref.id;

        var method = request.method;
        var query = request.query;
        var data = request.data;
        var db = new _db.DB(appKey, _this2.adapters);
        var promise = undefined;

        if (method === _enums.HttpMethod.GET) {
          if (id) {
            if (id === '_count') {
              promise = db.count(collection, query);
            } else if (id === '_group') {
              promise = db.group(collection, data);
            } else {
              promise = db.findById(collection, id);
            }
          } else {
            promise = db.find(collection, query);
          }
        } else if (method === _enums.HttpMethod.POST || method === _enums.HttpMethod.PUT) {
          promise = db.save(collection, data);
        } else if (method === _enums.HttpMethod.DELETE) {
          if (id) {
            promise = db.removeById(collection, id);
          } else {
            promise = db.remove(collection, query);
          }
        }

        return promise.then(function (result) {
          var statusCode = _enums.StatusCode.Ok;

          if (method === _enums.HttpMethod.POST) {
            statusCode = _enums.StatusCode.Created;
          }

          request.response = {
            statusCode: statusCode,
            headers: {},
            data: result
          };

          return request;
        });
      });
    }
  }]);

  return CacheMiddleware;
}(_middleware.KinveyMiddleware);