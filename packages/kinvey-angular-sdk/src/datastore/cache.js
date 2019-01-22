"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValidTag = isValidTag;
exports.clear = clear;
exports.QueryCache = exports.DataStoreCache = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isEmpty = _interopRequireDefault(require("lodash/isEmpty"));

var _cache = require("../cache");

var _config = require("../kinvey/config");

var _headers = require("../http/headers");

var _query = _interopRequireDefault(require("../query"));

var QUERY_CACHE_TAG = '_QueryCache';

function isValidTag(tag) {
  var regexp = /^[a-z0-9-]+$/i;
  return (0, _isString.default)(tag) && regexp.test(tag);
}

var DataStoreCache =
/*#__PURE__*/
function (_Cache) {
  (0, _inherits2.default)(DataStoreCache, _Cache);

  function DataStoreCache(collectionName, tag) {
    var _this;

    (0, _classCallCheck2.default)(this, DataStoreCache);

    var _getConfig = (0, _config.get)(),
        appKey = _getConfig.appKey;

    if (tag && !isValidTag(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    if (tag) {
      _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(DataStoreCache).call(this, appKey, "".concat(collectionName, ".").concat(tag)));
    } else {
      _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(DataStoreCache).call(this, appKey, collectionName));
    }

    return (0, _possibleConstructorReturn2.default)(_this);
  }

  return DataStoreCache;
}(_cache.Cache);

exports.DataStoreCache = DataStoreCache;

var QueryCache =
/*#__PURE__*/
function (_DataStoreCache) {
  (0, _inherits2.default)(QueryCache, _DataStoreCache);

  function QueryCache(tag) {
    (0, _classCallCheck2.default)(this, QueryCache);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(QueryCache).call(this, QUERY_CACHE_TAG, tag));
  } // eslint-disable-next-line class-methods-use-this


  (0, _createClass2.default)(QueryCache, [{
    key: "serializeQuery",
    value: function serializeQuery(query) {
      if (!query) {
        return '';
      }

      if (query.skip > 0 || query.limit < Infinity) {
        return null;
      }

      var queryObject = query.toQueryObject();
      return queryObject && !(0, _isEmpty.default)(queryObject) ? JSON.stringify(queryObject) : '';
    }
  }, {
    key: "findByKey",
    value: function () {
      var _findByKey = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(key) {
        var query, docs;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                query = new _query.default().equalTo('query', key);
                _context.next = 3;
                return this.find(query);

              case 3:
                docs = _context.sent;
                return _context.abrupt("return", docs.shift());

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function findByKey(_x) {
        return _findByKey.apply(this, arguments);
      }

      return findByKey;
    }()
  }, {
    key: "save",
    value: function () {
      var _save = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(query, response) {
        var key, headers, doc;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                key = this.serializeQuery(query);

                if (!(key !== null)) {
                  _context2.next = 9;
                  break;
                }

                headers = new _headers.KinveyHeaders(response.headers);
                _context2.next = 5;
                return this.findByKey(key);

              case 5:
                doc = _context2.sent;

                if (!doc) {
                  doc = {
                    collectionName: this.collectionName,
                    query: key
                  };
                }

                doc.lastRequest = headers.requestStart;
                return _context2.abrupt("return", (0, _get2.default)((0, _getPrototypeOf2.default)(QueryCache.prototype), "save", this).call(this, doc));

              case 9:
                return _context2.abrupt("return", null);

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function save(_x2, _x3) {
        return _save.apply(this, arguments);
      }

      return save;
    }()
  }]);
  return QueryCache;
}(DataStoreCache);

exports.QueryCache = QueryCache;

function clear() {
  return _clear2.apply(this, arguments);
}

function _clear2() {
  _clear2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3() {
    var _getConfig2, appKey;

    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _getConfig2 = (0, _config.get)(), appKey = _getConfig2.appKey;
            _context3.next = 3;
            return (0, _cache.clear)(appKey);

          case 3:
            return _context3.abrupt("return", null);

          case 4:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _clear2.apply(this, arguments);
}