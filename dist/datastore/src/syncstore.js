'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyncStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cachestore = require('./cachestore');

var _request = require('../../request');

var _errors = require('../../errors');

var _query = require('../../query');

var _utils = require('../../utils');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


/**
 * The SyncStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */
var SyncStore = exports.SyncStore = function (_CacheStore) {
  _inherits(SyncStore, _CacheStore);

  function SyncStore() {
    _classCallCheck(this, SyncStore);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SyncStore).apply(this, arguments));
  }

  _createClass(SyncStore, [{
    key: 'find',


    /**
     * Find all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                             Query used to filter entities.
     * @param   {Object}                [options]                           Options
     * @param   {Properties}            [options.properties]                Custom properties to send with
     *                                                                      the request.
     * @param   {Number}                [options.timeout]                   Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]             Turn on or off the use of delta fetch.
     * @return  {Observable}                                                Observable.
     */
    value: function find(query) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(observer) {
          var entities, request, response;
          return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  entities = [];

                  // Check that the query is valid

                  if (!(query && !(query instanceof _query.Query))) {
                    _context.next = 4;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 4:

                  // Fetch the cache entities
                  request = new _request.CacheRequest({
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

                  // Execute the request

                  _context.next = 7;
                  return request.execute();

                case 7:
                  response = _context.sent;

                  entities = response.data;

                  // Emit the cache entities
                  observer.next(entities);
                  _context.next = 15;
                  break;

                case 12:
                  _context.prev = 12;
                  _context.t0 = _context['catch'](0);

                  observer.error(_context.t0);

                case 15:
                  return _context.abrupt('return', observer.complete());

                case 16:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2, [[0, 12]]);
        }));

        return function (_x2) {
          return _ref.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Find a single entity in the data store by id.
     *
     * @param   {string}                id                               Entity by id to find.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]          Turn on or off the use of delta fetch.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'findById',
    value: function findById(id) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2(observer) {
          var request, response, entity;
          return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.prev = 0;

                  // Fetch from the cache
                  request = new _request.CacheRequest({
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
                  _context2.next = 4;
                  return request.execute();

                case 4:
                  response = _context2.sent;
                  entity = response.data;

                  // Emit the cache entity

                  observer.next(entity);
                  _context2.next = 12;
                  break;

                case 9:
                  _context2.prev = 9;
                  _context2.t0 = _context2['catch'](0);

                  observer.error(_context2.t0);

                case 12:
                  return _context2.abrupt('return', observer.complete());

                case 13:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this3, [[0, 9]]);
        }));

        return function (_x4) {
          return _ref2.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Count all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                          Query used to filter entities.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'count',
    value: function count(query) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(observer) {
          var request, response, data;
          return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;

                  if (!(query && !(query instanceof _query.Query))) {
                    _context3.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Fetch the entities in the cache
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this4.client.protocol,
                      host: _this4.client.host,
                      pathname: _this4.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });

                  // Execute the request

                  _context3.next = 6;
                  return request.execute();

                case 6:
                  response = _context3.sent;
                  data = response.data;

                  // Emit the cache count

                  observer.next(data ? data.length : 0);
                  _context3.next = 14;
                  break;

                case 11:
                  _context3.prev = 11;
                  _context3.t0 = _context3['catch'](0);
                  return _context3.abrupt('return', observer.error(_context3.t0));

                case 14:
                  return _context3.abrupt('return', observer.complete());

                case 15:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this4, [[0, 11]]);
        }));

        return function (_x6) {
          return _ref3.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: 'syncAutomatically',
    get: function get() {
      return false;
    }
  }]);

  return SyncStore;
}(_cachestore.CacheStore);