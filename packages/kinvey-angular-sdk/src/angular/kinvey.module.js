"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _core = require("@angular/core");

var _init2 = _interopRequireDefault(require("../kinvey/init"));

var _datastore = _interopRequireDefault(require("./datastore.service"));

var _endpoint = _interopRequireDefault(require("./endpoint.service"));

var _files = _interopRequireDefault(require("./files.service"));

var _ping = _interopRequireDefault(require("./ping.service"));

var _user = _interopRequireDefault(require("./user.service"));

var KinveyModule =
/*#__PURE__*/
function () {
  function KinveyModule() {
    (0, _classCallCheck2.default)(this, KinveyModule);
  }

  (0, _createClass2.default)(KinveyModule, null, [{
    key: "init",
    value: function init(config) {
      (0, _init2.default)(config);
      return {
        ngModule: KinveyModule,
        providers: [_datastore.default, _endpoint.default, _files.default, _ping.default, _user.default]
      };
    }
  }]);
  return KinveyModule;
}();

KinveyModule.decorators = [{
  type: _core.NgModule
}];
var _default = KinveyModule;
exports.default = _default;