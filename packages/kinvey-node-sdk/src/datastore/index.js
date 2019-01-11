"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collection = collection;
exports.getInstance = getInstance;
exports.clear = clear;
exports.clearCache = clearCache;
exports.DataStoreType = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _cache = require("./cache");

var _networkstore = require("./networkstore");

var _cachestore = require("./cachestore");

var DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};
exports.DataStoreType = DataStoreType;

function collection(collectionName) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DataStoreType.Cache;
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var datastore;
  var tagWasPassed = options && 'tag' in options;

  if (collectionName == null || !(0, _isString.default)(collectionName)) {
    throw new _kinvey.default('A collection is required and must be a string.');
  }

  if (tagWasPassed && !(0, _cache.isValidTag)(options.tag)) {
    throw new _kinvey.default('Please provide a valid data store tag.');
  }

  if (type === DataStoreType.Network) {
    if (tagWasPassed) {
      throw new _kinvey.default('The tagged option is not valid for data stores of type "Network"');
    }

    datastore = new _networkstore.NetworkStore(collectionName);
  } else if (type === DataStoreType.Cache) {
    datastore = new _cachestore.CacheStore(collectionName, Object.assign({}, options, {
      autoSync: true
    }));
  } else if (type === DataStoreType.Sync) {
    datastore = new _cachestore.CacheStore(collectionName, Object.assign({}, options, {
      autoSync: false
    }));
  } else {
    throw new Error('Unknown data store type.');
  }

  return datastore;
}

function getInstance(collection, type, options) {
  return collection(collection, type, options);
}

function clear() {
  return _clear2.apply(this, arguments);
}

function _clear2() {
  _clear2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", (0, _cache.clear)());

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _clear2.apply(this, arguments);
}

function clearCache() {
  return _clearCache.apply(this, arguments);
}

function _clearCache() {
  _clearCache = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2() {
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", clear());

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _clearCache.apply(this, arguments);
}