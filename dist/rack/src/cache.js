'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CacheMiddleware = function (_Middleware) {
  _inherits(CacheMiddleware, _Middleware);

  function CacheMiddleware() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Cache Middleware';

    _classCallCheck(this, CacheMiddleware);

    return _possibleConstructorReturn(this, (CacheMiddleware.__proto__ || Object.getPrototypeOf(CacheMiddleware)).call(this, name));
  }

  _createClass(CacheMiddleware, [{
    key: 'openStorage',
    value: function openStorage(name) {
      return new _storage2.default(name);
    }
  }, {
    key: 'handle',
    value: function handle(request) {
      var method = request.method;
      var body = request.body;
      var appKey = request.appKey;
      var collection = request.collection;
      var entityId = request.entityId;
      var encryptionKey = request.encryptionKey;

      var storage = this.openStorage(appKey, encryptionKey);
      var promise = void 0;

      if (method === 'GET') {
        if (entityId) {
          promise = storage.findById(collection, entityId);
        } else {
          promise = storage.find(collection);
        }
      } else if (method === 'POST' || method === 'PUT') {
        promise = storage.save(collection, body);
      } else if (method === 'DELETE') {
        if (collection && entityId) {
          promise = storage.removeById(collection, entityId);
        } else if (!collection) {
          promise = storage.clear();
        } else {
          promise = storage.remove(collection, body);
        }
      }

      return promise.then(function (data) {
        var response = {
          statusCode: method === 'POST' ? 201 : 200,
          data: data
        };

        if (!data || (0, _isEmpty2.default)(data)) {
          response.statusCode = 204;
        }

        return response;
      }).catch(function (error) {
        return { statusCode: error.code || 500 };
      }).then(function (response) {
        return { response: response };
      });
    }
  }]);

  return CacheMiddleware;
}(_middleware2.default);

exports.default = CacheMiddleware;