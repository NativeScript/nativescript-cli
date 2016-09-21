'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataStore = exports.DataStoreType = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable-line no-unused-vars


var _request = require('../../request');

var _errors = require('../../errors');

var _client = require('../../client');

var _networkstore = require('./networkstore');

var _cachestore = require('./cachestore');

var _syncstore = require('./syncstore');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process && process.env && process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata' || 'appdata';

/**
 * @typedef   {Object}    DataStoreType
 * @property  {string}    Cache           Cache datastore type
 * @property  {string}    Network         Network datastore type
 * @property  {string}    Sync            Sync datastore type
 */
var DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};
Object.freeze(DataStoreType);
exports.DataStoreType = DataStoreType;

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
 */

var DataStore = function () {
  function DataStore() {
    _classCallCheck(this, DataStore);

    throw new _errors.KinveyError('Not allowed to construct a DataStore instance.' + ' Please use the collection() function to retrieve an instance of a DataStore instance.');
  }

  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       [collection]                  Name of the collection.
   * @param  {StoreType}    [type=DataStoreType.Network]  Type of store to return.
   * @return {DataStore}                                  DataStore instance.
   */


  _createClass(DataStore, null, [{
    key: 'collection',
    value: function collection(_collection) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? DataStoreType.Cache : arguments[1];
      var options = arguments[2];

      var store = void 0;

      if (!_collection) {
        throw new _errors.KinveyError('A collection is required.');
      }

      switch (type) {
        case DataStoreType.Network:
          store = new _networkstore.NetworkStore(_collection, options);
          break;
        case DataStoreType.Sync:
          store = new _syncstore.SyncStore(_collection, options);
          break;
        case DataStoreType.Cache:
        default:
          store = new _cachestore.CacheStore(_collection, options);

      }

      return store;
    }

    /**
     * @private
     */

  }, {
    key: 'getInstance',
    value: function getInstance(collection, type, options) {
      return this.collection(collection, type, options);
    }

    /**
     * Clear the cache. This will delete all data in the cache.
     *
     * @param  {Object} [options={}] Options
     * @return {Promise<Object>} The result of clearing the cache.
     */

  }, {
    key: 'clearCache',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var client, pathname, request, response;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                client = options.client || _client.Client.sharedInstance();
                pathname = '/' + appdataNamespace + '/' + client.appKey;
                request = new _request.CacheRequest({
                  method: _request.RequestMethod.DELETE,
                  url: _url2.default.format({
                    protocol: client.protocol,
                    host: client.host,
                    pathname: pathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  timeout: options.timeout
                });
                _context.next = 5;
                return request.execute();

              case 5:
                response = _context.sent;
                return _context.abrupt('return', response.data);

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function clearCache(_x2) {
        return _ref.apply(this, arguments);
      }

      return clearCache;
    }()
  }]);

  return DataStore;
}();

exports.DataStore = DataStore;