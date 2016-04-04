'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeltaFetchRequest = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _request = require('./request');

var _local = require('./local');

var _network = require('./network');

var _response = require('./response');

var _enums = require('../enums');

var _errors = require('../errors');

var _query3 = require('../query');

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
var lmtAttribute = process.env.KINVEY_LMT_ATTRIBUTE || 'lmt';
var maxIdsPerRequest = process.env.KINVEY_MAX_IDS || 200;

/**
 * @private
 */

var DeltaFetchRequest = exports.DeltaFetchRequest = function (_KinveyRequest) {
  _inherits(DeltaFetchRequest, _KinveyRequest);

  function DeltaFetchRequest() {
    _classCallCheck(this, DeltaFetchRequest);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(DeltaFetchRequest).apply(this, arguments));
  }

  _createClass(DeltaFetchRequest, [{
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      var promise = _get(Object.getPrototypeOf(DeltaFetchRequest.prototype), 'execute', this).call(this).then(function () {
        if (_this2.method !== _enums.HttpMethod.GET) {
          throw new Error('Invalid http method. Http GET requests are only supported by DeltaFetchRequests.');
        }

        var localRequest = new _local.LocalRequest({
          method: _enums.HttpMethod.GET,
          url: _this2.url,
          headers: _this2.headers,
          query: _this2.query,
          timeout: _this2.timeout,
          client: _this2.client
        });
        return localRequest.execute();
      }).catch(function (error) {
        if (error instanceof _errors.NotFoundError) {
          return new _response.Response({
            statusCode: _enums.StatusCode.Ok,
            data: []
          });
        }

        throw error;
      }).then(function (cacheResponse) {
        if (cacheResponse.data.length > 0) {
          var _ret = function () {
            var cacheDocuments = (0, _keyBy2.default)(cacheResponse.data, idAttribute);
            var query = new _query3.Query((0, _result2.default)(_this2.query, 'toJSON', _this2.query));
            query.fields([idAttribute, kmdAttribute]);
            var networkRequest = new _network.NetworkRequest({
              method: _enums.HttpMethod.GET,
              url: _this2.url,
              headers: _this2.headers,
              auth: _this2.auth,
              query: query,
              timeout: _this2.timeout,
              client: _this2.client
            });

            return {
              v: networkRequest.execute().then(function (networkResponse) {
                var networkDocuments = (0, _keyBy2.default)(networkResponse.data, idAttribute);
                var deltaSet = networkDocuments;
                var cacheDocumentIds = Object.keys(cacheDocuments);

                (0, _forEach2.default)(cacheDocumentIds, function (id) {
                  var cacheDocument = cacheDocuments[id];
                  var networkDocument = networkDocuments[id];

                  if (networkDocument) {
                    if (networkDocument[kmdAttribute] && cacheDocument[kmdAttribute] && networkDocument[kmdAttribute][lmtAttribute] === cacheDocument[kmdAttribute][lmtAttribute]) {
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
                  var _query = new _query3.Query((0, _result2.default)(_this2.query, 'toJSON', _this2.query));
                  var ids = deltaSetIds.slice(i, deltaSetIds.length > maxIdsPerRequest + i ? maxIdsPerRequest : deltaSetIds.length);
                  _query.contains(idAttribute, ids);
                  var _networkRequest = new _network.NetworkRequest({
                    method: _enums.HttpMethod.GET,
                    url: _this2.url,
                    headers: _this2.headers,
                    auth: _this2.auth,
                    query: _query,
                    timeout: _this2.timeout,
                    client: _this2.client
                  });

                  var _promise = _networkRequest.execute();
                  promises.push(_promise);
                  i += maxIdsPerRequest;
                }

                return _babybird2.default.all(promises).then(function (responses) {
                  var initialResponse = new _response.Response({
                    statusCode: _enums.StatusCode.Ok,
                    data: []
                  });
                  return (0, _reduce2.default)(responses, function (result, response) {
                    if (response.isSuccess()) {
                      result.addHeaders(response.headers);
                      result.data = result.data.concat(response.data);
                    }

                    return result;
                  }, initialResponse);
                }).then(function (response) {
                  response.data = response.data.concat((0, _values2.default)(cacheDocuments));

                  if (_this2.query) {
                    var _query2 = new _query3.Query((0, _result2.default)(_this2.query, 'toJSON', _this2.query));
                    _query2.skip(0).limit(0);
                    response.data = _query2._process(response.data);
                  }

                  return response;
                });
              })
            };
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }

        var networkRequest = new _network.NetworkRequest({
          method: _enums.HttpMethod.GET,
          url: _this2.url,
          headers: _this2.headers,
          auth: _this2.auth,
          query: _this2.query,
          timeout: _this2.timeout,
          client: _this2.client
        });
        return networkRequest.execute();
      });

      return promise;
    }
  }]);

  return DeltaFetchRequest;
}(_request.KinveyRequest);
//# sourceMappingURL=deltafetch.js.map
