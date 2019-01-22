"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _core = require("@angular/core");

var _ping2 = _interopRequireDefault(require("../ping"));

/* eslint-disable class-methods-use-this */
var PingService =
/*#__PURE__*/
function () {
  function PingService() {
    (0, _classCallCheck2.default)(this, PingService);
  }

  (0, _createClass2.default)(PingService, [{
    key: "ping",
    value: function ping() {
      return (0, _ping2.default)();
    }
  }]);
  return PingService;
}();

PingService.decorators = [{
  type: _core.Injectable
}];
var _default = PingService;
exports.default = _default;