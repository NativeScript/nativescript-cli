'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cachestore = require('./cachestore');

var _cachestore2 = _interopRequireDefault(_cachestore);

var _request = require('../../request');

var _errors = require('../../errors');

var _query = require('../../query');

var _query2 = _interopRequireDefault(_query);

var _aggregation = require('../../aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _utils = require('../../utils');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SyncStore = function (_CacheStore) {
  _inherits(SyncStore, _CacheStore);

  function SyncStore() {
    _classCallCheck(this, SyncStore);

    return _possibleConstructorReturn(this, (SyncStore.__proto__ || Object.getPrototypeOf(SyncStore)).apply(this, arguments));
  }

  _createClass(SyncStore, [{
    key: 'find',
    value: function find(query) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        if (query && !(query instanceof _query2.default)) {
          return observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.'));
        }

        var request = new _request.CacheRequest({
          method: _request.RequestMethod.GET,
          url: _url2.default.format({
            protocol: _this2.client.protocol,
            host: _this2.client.host,
            pathname: _this2.pathname,
            query: options.query
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout
        });

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (data) {
          return observer.next(data);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream;
    }
  }, {
    key: 'findById',
    value: function findById(id) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        try {
          var request = new _request.CacheRequest({
            method: _request.RequestMethod.GET,
            url: _url2.default.format({
              protocol: _this3.client.protocol,
              host: _this3.client.host,
              pathname: _this3.pathname + '/' + id,
              query: options.query
            }),
            properties: options.properties,
            timeout: options.timeout
          });

          return request.execute().then(function (response) {
            return response.data;
          }).then(function (data) {
            return observer.next(data);
          }).then(function () {
            return observer.complete();
          }).catch(function (error) {
            return observer.error(error);
          });
        } catch (error) {
          return observer.error(error);
        }
      });

      return stream;
    }
  }, {
    key: 'group',
    value: function group(aggregation) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        if (!(aggregation instanceof _aggregation2.default)) {
          return observer.error(new _errors.KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.'));
        }

        var request = new _request.CacheRequest({
          method: _request.RequestMethod.GET,
          url: _url2.default.format({
            protocol: _this4.client.protocol,
            host: _this4.client.host,
            pathname: _this4.pathname + '/_group'
          }),
          properties: options.properties,
          aggregation: aggregation,
          timeout: options.timeout
        });

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (result) {
          return observer.next(result);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });
      return stream;
    }
  }, {
    key: 'count',
    value: function count(query) {
      var _this5 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        try {
          if (query && !(query instanceof _query2.default)) {
            throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');
          }

          var request = new _request.CacheRequest({
            method: _request.RequestMethod.GET,
            url: _url2.default.format({
              protocol: _this5.client.protocol,
              host: _this5.client.host,
              pathname: _this5.pathname,
              query: options.query
            }),
            properties: options.properties,
            query: query,
            timeout: options.timeout
          });

          return request.execute().then(function (response) {
            return response.data;
          }).then(function (data) {
            return observer.next(data ? data.length : 0);
          }).then(function () {
            return observer.complete();
          }).catch(function (error) {
            return observer.error(error);
          });
        } catch (error) {
          return observer.error(error);
        }
      });

      return stream;
    }
  }, {
    key: 'syncAutomatically',
    get: function get() {
      return false;
    }
  }]);

  return SyncStore;
}(_cachestore2.default);

exports.default = SyncStore;