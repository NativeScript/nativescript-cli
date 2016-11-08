'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _kinveyrequest = require('./kinveyrequest');

var _kinveyrequest2 = _interopRequireDefault(_kinveyrequest);

var _request2 = require('./request');

var _cacherequest = require('./cacherequest');

var _cacherequest2 = _interopRequireDefault(_cacherequest);

var _response = require('./response');

var _response2 = _interopRequireDefault(_response);

var _errors = require('../../errors');

var _query3 = require('../../query');

var _query4 = _interopRequireDefault(_query3);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _values = require('lodash/values');

var _values2 = _interopRequireDefault(_values);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var maxIdsPerRequest = 200;

var DeltaFetchRequest = function (_KinveyRequest) {
  _inherits(DeltaFetchRequest, _KinveyRequest);

  function DeltaFetchRequest() {
    _classCallCheck(this, DeltaFetchRequest);

    return _possibleConstructorReturn(this, (DeltaFetchRequest.__proto__ || Object.getPrototypeOf(DeltaFetchRequest)).apply(this, arguments));
  }

  _createClass(DeltaFetchRequest, [{
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      var request = new _cacherequest2.default({
        method: _request2.RequestMethod.GET,
        url: this.url,
        headers: this.headers,
        query: this.query,
        timeout: this.timeout,
        client: this.client
      });
      return request.execute().then(function (response) {
        return response.data;
      }).catch(function (error) {
        if (!(error instanceof _errors.NotFoundError)) {
          throw error;
        }

        return [];
      }).then(function (cacheData) {
        if ((0, _isArray2.default)(cacheData) && cacheData.length > 0) {
          var _ret = function () {
            var cacheDocuments = (0, _keyBy2.default)(cacheData, '_id');
            var query = new _query4.default((0, _result2.default)(_this2.query, 'toJSON', _this2.query));
            query.fields = ['_id', '_kmd.lmt'];
            var request = new _kinveyrequest2.default({
              method: _request2.RequestMethod.GET,
              url: _this2.url,
              headers: _this2.headers,
              authType: _this2.authType,
              query: query,
              timeout: _this2.timeout,
              client: _this2.client,
              properties: _this2.properties,
              skipBL: _this2.skipBL,
              trace: _this2.trace,
              followRedirect: _this2.followRedirect,
              cache: _this2.cache
            });

            return {
              v: request.execute().then(function (response) {
                return response.data;
              }).then(function (networkData) {
                var networkDocuments = (0, _keyBy2.default)(networkData, '_id');
                var deltaSet = networkDocuments;
                var cacheDocumentIds = Object.keys(cacheDocuments);

                (0, _forEach2.default)(cacheDocumentIds, function (id) {
                  var cacheDocument = cacheDocuments[id];
                  var networkDocument = networkDocuments[id];

                  if (networkDocument) {
                    if (networkDocument._kmd && cacheDocument._kmd && networkDocument._kmd.lmt === cacheDocument._kmd.lmt) {
                      delete deltaSet[id];
                    } else {
                      delete cacheDocuments[id];
                    }
                  } else {
                    delete cacheDocuments[id];
                  }
                });

                var deltaSetIds = Object.keys(deltaSet);
                var promises = [];
                var i = 0;

                while (i < deltaSetIds.length) {
                  var _query = new _query4.default((0, _result2.default)(_this2.query, 'toJSON', _this2.query));
                  var ids = deltaSetIds.slice(i, deltaSetIds.length > maxIdsPerRequest + i ? maxIdsPerRequest : deltaSetIds.length);
                  _query.contains('_id', ids);

                  var _request = new _kinveyrequest2.default({
                    method: _request2.RequestMethod.GET,
                    url: _this2.url,
                    headers: _this2.headers,
                    authType: _this2.authType,
                    query: _query,
                    timeout: _this2.timeout,
                    client: _this2.client,
                    properties: _this2.properties,
                    skipBL: _this2.skipBL,
                    trace: _this2.trace,
                    followRedirect: _this2.followRedirect,
                    cache: _this2.cache
                  });

                  var promise = _request.execute();
                  promises.push(promise);
                  i += maxIdsPerRequest;
                }

                return _es6Promise2.default.all(promises);
              }).then(function (responses) {
                var response = (0, _reduce2.default)(responses, function (result, response) {
                  if (response.isSuccess()) {
                    var headers = result.headers;
                    headers.addAll(response.headers);
                    result.headers = headers;
                    result.data = result.data.concat(response.data);
                  }

                  return result;
                }, new _response2.default({
                  statusCode: _response.StatusCode.Ok,
                  data: []
                }));

                response.data = response.data.concat((0, _values2.default)(cacheDocuments));

                if (_this2.query) {
                  var _query2 = new _query4.default((0, _result2.default)(_this2.query, 'toJSON', _this2.query));
                  _query2.skip(0).limit(0);
                  response.data = _query2.process(response.data);
                }

                return response;
              })
            };
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }

        var request = new _kinveyrequest2.default({
          method: _request2.RequestMethod.GET,
          url: _this2.url,
          headers: _this2.headers,
          authType: _this2.authType,
          query: _this2.query,
          timeout: _this2.timeout,
          client: _this2.client,
          properties: _this2.properties,
          skipBL: _this2.skipBL,
          trace: _this2.trace,
          followRedirect: _this2.followRedirect,
          cache: _this2.cache
        });
        return request.execute();
      });
    }
  }, {
    key: 'method',
    get: function get() {
      return _get(DeltaFetchRequest.prototype.__proto__ || Object.getPrototypeOf(DeltaFetchRequest.prototype), 'method', this);
    },
    set: function set(method) {
      if (!(0, _isString2.default)(method)) {
        method = String(method);
      }

      method = method.toUpperCase();

      switch (method) {
        case _request2.RequestMethod.GET:
          _set(DeltaFetchRequest.prototype.__proto__ || Object.getPrototypeOf(DeltaFetchRequest.prototype), 'method', method, this);
          break;
        case _request2.RequestMethod.POST:
        case _request2.RequestMethod.PATCH:
        case _request2.RequestMethod.PUT:
        case _request2.RequestMethod.DELETE:
        default:
          throw new Error('Invalid request Method. Only RequestMethod.GET is allowed.');
      }
    }
  }]);

  return DeltaFetchRequest;
}(_kinveyrequest2.default);

exports.default = DeltaFetchRequest;