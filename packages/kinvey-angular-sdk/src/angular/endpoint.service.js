"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _core = require("@angular/core");

var _endpoint2 = _interopRequireDefault(require("../endpoint"));

/* eslint-disable class-methods-use-this */
var EndpointService =
/*#__PURE__*/
function () {
  function EndpointService() {
    (0, _classCallCheck2.default)(this, EndpointService);
  }

  (0, _createClass2.default)(EndpointService, [{
    key: "endpoint",
    value: function endpoint() {
      return _endpoint2.default.apply(void 0, arguments);
    }
  }, {
    key: "execute",
    value: function execute() {
      return this.endpoint.apply(this, arguments);
    }
  }]);
  return EndpointService;
}();

EndpointService.decorators = [{
  type: _core.Injectable
}];
var _default = EndpointService;
exports.default = _default;