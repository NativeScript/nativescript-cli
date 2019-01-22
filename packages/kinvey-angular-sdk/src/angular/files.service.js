"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _core = require("@angular/core");

var _create2 = _interopRequireDefault(require("../files/create"));

var _download2 = _interopRequireDefault(require("../files/download"));

var _downloadByUrl2 = _interopRequireDefault(require("../files/downloadByUrl"));

var _find2 = _interopRequireDefault(require("../files/find"));

var _findById2 = _interopRequireDefault(require("../files/findById"));

var _remove2 = _interopRequireDefault(require("../files/remove"));

var _removeById2 = _interopRequireDefault(require("../files/removeById"));

var _stream2 = _interopRequireDefault(require("../files/stream"));

var _update2 = _interopRequireDefault(require("../files/update"));

var _upload2 = _interopRequireDefault(require("../files/upload"));

/* eslint-disable class-methods-use-this */
var FileService =
/*#__PURE__*/
function () {
  function FileService() {
    (0, _classCallCheck2.default)(this, FileService);
  }

  (0, _createClass2.default)(FileService, [{
    key: "create",
    value: function create() {
      return _create2.default.apply(void 0, arguments);
    }
  }, {
    key: "download",
    value: function download() {
      return _download2.default.apply(void 0, arguments);
    }
  }, {
    key: "downloadByUrl",
    value: function downloadByUrl() {
      return _downloadByUrl2.default.apply(void 0, arguments);
    }
  }, {
    key: "find",
    value: function find() {
      return _find2.default.apply(void 0, arguments);
    }
  }, {
    key: "findById",
    value: function findById() {
      return _findById2.default.apply(void 0, arguments);
    }
  }, {
    key: "remove",
    value: function remove() {
      return _remove2.default.apply(void 0, arguments);
    }
  }, {
    key: "removeById",
    value: function removeById() {
      return _removeById2.default.apply(void 0, arguments);
    }
  }, {
    key: "stream",
    value: function stream() {
      return _stream2.default.apply(void 0, arguments);
    }
  }, {
    key: "update",
    value: function update() {
      return _update2.default.apply(void 0, arguments);
    }
  }, {
    key: "upload",
    value: function upload() {
      return _upload2.default.apply(void 0, arguments);
    }
  }]);
  return FileService;
}();

FileService.decorators = [{
  type: _core.Injectable
}];
var _default = FileService;
exports.default = _default;