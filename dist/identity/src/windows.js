'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Windows = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _identity = require('./identity');

var _identity2 = _interopRequireDefault(_identity);

var _enums = require('./enums');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Windows = exports.Windows = function (_Identity) {
  _inherits(Windows, _Identity);

  function Windows() {
    _classCallCheck(this, Windows);

    return _possibleConstructorReturn(this, (Windows.__proto__ || Object.getPrototypeOf(Windows)).apply(this, arguments));
  }

  _createClass(Windows, [{
    key: 'identity',
    get: function get() {
      return _enums.SocialIdentity.Windows;
    }
  }], [{
    key: 'identity',
    get: function get() {
      return _enums.SocialIdentity.Windows;
    }
  }]);

  return Windows;
}(_identity2.default);