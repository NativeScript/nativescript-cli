"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _core = require("@angular/core");

var _datastore = require("../datastore");

/* eslint-disable class-methods-use-this */
var DataStoreService =
/*#__PURE__*/
function () {
  function DataStoreService() {
    (0, _classCallCheck2.default)(this, DataStoreService);
  }

  (0, _createClass2.default)(DataStoreService, [{
    key: "collection",
    value: function collection() {
      return _datastore.collection.apply(void 0, arguments);
    }
  }, {
    key: "getInstance",
    value: function getInstance() {
      return _datastore.getInstance.apply(void 0, arguments);
    }
  }, {
    key: "clear",
    value: function clear() {
      return _datastore.clear.apply(void 0, arguments);
    }
  }, {
    key: "clearCache",
    value: function clearCache() {
      return _datastore.clearCache.apply(void 0, arguments);
    }
  }]);
  return DataStoreService;
}();

DataStoreService.decorators = [{
  type: _core.Injectable
}];
var _default = DataStoreService;
exports.default = _default;