'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearCache = exports.DataStoreType = undefined;

var clearCache = exports.clearCache = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var promises, responses;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            promises = [];

            DATASTORE_POOL.forEach(function (datastore) {
              if (datastore instanceof _cachestore2.default) {
                promises.push(datastore.clear());
              }
            });
            _context.next = 4;
            return Promise.all(promises);

          case 4:
            responses = _context.sent;
            return _context.abrupt('return', responses);

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function clearCache() {
    return _ref.apply(this, arguments);
  };
}();

exports.collection = collection;

var _client = require('../client');

var _networkstore = require('./networkstore');

var _networkstore2 = _interopRequireDefault(_networkstore);

var _cachestore = require('./cachestore');

var _cachestore2 = _interopRequireDefault(_cachestore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var DATASTORE_POOL = new Map();

var DataStoreType = exports.DataStoreType = {
  Cache: 'Cache',
  Network: 'Network'
};

function collection(collectionName) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DataStoreType.Cache;
  var tag = arguments[2];
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { useDeltaSet: false, useAutoPagination: false };

  if (collectionName == null || typeof collectionName !== 'string') {
    throw new Error('A collection name is required and must be a string.');
  }

  var _getConfig = (0, _client.getConfig)(),
      appKey = _getConfig.appKey;

  var key = '' + appKey + collectionName + type + tag;
  var datastore = DATASTORE_POOL.get(key);

  if (!datastore) {
    if (type === DataStoreType.Network) {
      datastore = new _networkstore2.default(appKey, collectionName);
    } else if (type === DataStoreType.Cache) {
      datastore = new _cachestore2.default(appKey, collectionName, tag, options);
    } else {
      throw new Error('Unknown data store type.');
    }

    DATASTORE_POOL.set(key, datastore);
  }

  return datastore;
}