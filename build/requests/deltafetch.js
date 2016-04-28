'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeltaFetchRequest = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

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

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _babybird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _babybird2.default.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var idAttribute = '_id' || '_id';
var kmdAttribute = '_kmd' || '_kmd';
var maxIdsPerRequest = 200;

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var _this2 = this;

        var cacheData, request, _ret, networkRequest;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                cacheData = [];
                _context2.next = 3;
                return _get(Object.getPrototypeOf(DeltaFetchRequest.prototype), 'execute', this).call(this);

              case 3:
                _context2.prev = 3;
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: this.url,
                  headers: this.headers,
                  query: this.query,
                  timeout: this.timeout,
                  client: this.client
                });
                _context2.next = 7;
                return request.execute().then(function (cacheResponse) {
                  return cacheResponse.data;
                });

              case 7:
                cacheData = _context2.sent;
                _context2.next = 15;
                break;

              case 10:
                _context2.prev = 10;
                _context2.t0 = _context2['catch'](3);

                if (_context2.t0 instanceof _errors.NotFoundError) {
                  _context2.next = 14;
                  break;
                }

                throw _context2.t0;

              case 14:

                cacheData = [];

              case 15:
                if (!((0, _isArray2.default)(cacheData) && cacheData.length > 0)) {
                  _context2.next = 20;
                  break;
                }

                return _context2.delegateYield(regeneratorRuntime.mark(function _callee() {
                  var cacheDocuments, query, networkRequest, networkData, networkDocuments, deltaSet, cacheDocumentIds, deltaSetIds, promises, i, _query, ids, _networkRequest, promise, responses, response, _query2;

                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          cacheDocuments = (0, _keyBy2.default)(cacheData, idAttribute);
                          query = new _query3.Query((0, _result2.default)(_this2.query, 'toJSON', _this2.query));

                          query.fields = [idAttribute, kmdAttribute];
                          networkRequest = new _network.NetworkRequest({
                            method: _enums.HttpMethod.GET,
                            url: _this2.url,
                            headers: _this2.headers,
                            auth: _this2.auth,
                            query: query,
                            timeout: _this2.timeout,
                            client: _this2.client
                          });
                          _context.next = 6;
                          return networkRequest.execute().then(function (response) {
                            return response.data;
                          });

                        case 6:
                          networkData = _context.sent;
                          networkDocuments = (0, _keyBy2.default)(networkData, idAttribute);
                          deltaSet = networkDocuments;
                          cacheDocumentIds = Object.keys(cacheDocuments);


                          (0, _forEach2.default)(cacheDocumentIds, function (id) {
                            var cacheDocument = cacheDocuments[id];
                            var networkDocument = networkDocuments[id];

                            if (networkDocument) {
                              if (networkDocument[kmdAttribute] && cacheDocument[kmdAttribute] && networkDocument[kmdAttribute].lmt === cacheDocument[kmdAttribute].lmt) {
                                delete deltaSet[id];
                              } else {
                                delete cacheDocuments[id];
                              }
                            } else {
                              delete cacheDocuments[id];
                            }
                          });

                          deltaSetIds = Object.keys(deltaSet);
                          promises = [];
                          i = 0;


                          while (i < deltaSetIds.length) {
                            _query = new _query3.Query((0, _result2.default)(_this2.query, 'toJSON', _this2.query));
                            ids = deltaSetIds.slice(i, deltaSetIds.length > maxIdsPerRequest + i ? maxIdsPerRequest : deltaSetIds.length);

                            _query.contains(idAttribute, ids);
                            _networkRequest = new _network.NetworkRequest({
                              method: _enums.HttpMethod.GET,
                              url: _this2.url,
                              headers: _this2.headers,
                              auth: _this2.auth,
                              query: _query,
                              timeout: _this2.timeout,
                              client: _this2.client
                            });
                            promise = _networkRequest.execute();

                            promises.push(promise);
                            i += maxIdsPerRequest;
                          }

                          _context.next = 17;
                          return _babybird2.default.all(promises);

                        case 17:
                          responses = _context.sent;
                          response = (0, _reduce2.default)(responses, function (result, response) {
                            if (response.isSuccess()) {
                              result.addHeaders(response.headers);
                              result.data = result.data.concat(response.data);
                            }

                            return result;
                          }, new _response.Response({
                            statusCode: _enums.StatusCode.Ok,
                            data: []
                          }));


                          response.data = response.data.concat((0, _values2.default)(cacheDocuments));

                          if (_this2.query) {
                            _query2 = new _query3.Query((0, _result2.default)(_this2.query, 'toJSON', _this2.query));

                            _query2.skip(0).limit(0);
                            response.data = _query2._process(response.data);
                          }

                          return _context.abrupt('return', {
                            v: response
                          });

                        case 22:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, _this2);
                })(), 't1', 17);

              case 17:
                _ret = _context2.t1;

                if (!((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")) {
                  _context2.next = 20;
                  break;
                }

                return _context2.abrupt('return', _ret.v);

              case 20:
                networkRequest = new _network.NetworkRequest({
                  method: _enums.HttpMethod.GET,
                  url: this.url,
                  headers: this.headers,
                  auth: this.auth,
                  query: this.query,
                  timeout: this.timeout,
                  client: this.client
                });
                return _context2.abrupt('return', networkRequest.execute());

              case 22:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[3, 10]]);
      }));

      function execute() {
        return ref.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: 'method',
    get: function get() {
      return _get(Object.getPrototypeOf(DeltaFetchRequest.prototype), 'method', this);
    },
    set: function set(method) {
      // Cast the method to a string
      if (!(0, _isString2.default)(method)) {
        method = String(method);
      }

      // Make sure the the method is upper case
      method = method.toUpperCase();

      // Verify that the method is allowed
      switch (method) {
        case _enums.HttpMethod.GET:
          _set(Object.getPrototypeOf(DeltaFetchRequest.prototype), 'method', method, this);
          break;
        case _enums.HttpMethod.POST:
        case _enums.HttpMethod.PATCH:
        case _enums.HttpMethod.PUT:
        case _enums.HttpMethod.DELETE:
        default:
          throw new Error('Invalid Http Method. Only GET is allowed.');
      }
    }
  }]);

  return DeltaFetchRequest;
}(_request.KinveyRequest);