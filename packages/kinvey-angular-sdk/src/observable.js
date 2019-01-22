"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _rxjs = require("rxjs");

var KinveyObservable =
/*#__PURE__*/
function (_Observable) {
  (0, _inherits2.default)(KinveyObservable, _Observable);

  function KinveyObservable() {
    (0, _classCallCheck2.default)(this, KinveyObservable);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(KinveyObservable).apply(this, arguments));
  }

  (0, _createClass2.default)(KinveyObservable, [{
    key: "toPromise",
    value: function toPromise() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var value;

        _this.subscribe(function (v) {
          value = v;
        }, reject, function () {
          resolve(value);
        });
      });
    }
  }]);
  return KinveyObservable;
}(_rxjs.Observable);

exports.default = KinveyObservable;