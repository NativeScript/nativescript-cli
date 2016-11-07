'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataStoreType = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('../../request');

var _errors = require('../../errors');

var _client = require('../../client');

var _networkstore = require('./networkstore');

var _networkstore2 = _interopRequireDefault(_networkstore);

var _cachestore = require('./cachestore');

var _cachestore2 = _interopRequireDefault(_cachestore);

var _syncstore = require('./syncstore');

var _syncstore2 = _interopRequireDefault(_syncstore);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process && process.env && process.env.KINVEY_DATASTORE_NAMESPACE || undefined || 'appdata';

var DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};
Object.freeze(DataStoreType);
exports.DataStoreType = DataStoreType;

var DataStore = function () {
  function DataStore() {
    _classCallCheck(this, DataStore);

    throw new _errors.KinveyError('Not allowed to construct a DataStore instance.' + ' Please use the collection() function to retrieve an instance of a DataStore instance.');
  }

  _createClass(DataStore, null, [{
    key: 'collection',
    value: function collection(_collection) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DataStoreType.Cache;
      var options = arguments[2];

      var store = void 0;

      if (!_collection) {
        throw new _errors.KinveyError('A collection is required.');
      }

      switch (type) {
        case DataStoreType.Network:
          store = new _networkstore2.default(_collection, options);
          break;
        case DataStoreType.Sync:
          store = new _syncstore2.default(_collection, options);
          break;
        case DataStoreType.Cache:
        default:
          store = new _cachestore2.default(_collection, options);

      }

      return store;
    }
  }, {
    key: 'getInstance',
    value: function getInstance(collection, type, options) {
      return this.collection(collection, type, options);
    }
  }, {
    key: 'clearCache',
    value: function clearCache() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var client = options.client || _client.Client.sharedInstance();
      var pathname = '/' + appdataNamespace + '/' + client.appKey;
      var request = new _request.CacheRequest({
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
      return request.execute().then(function (response) {
        return response.data;
      });
    }
  }]);

  return DataStore;
}();

exports.default = DataStore;