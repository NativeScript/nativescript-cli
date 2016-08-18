'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Windows = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _social = require('./social');

var _enums = require('./enums');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 */
var Windows = exports.Windows = function (_Social) {
  _inherits(Windows, _Social);

  function Windows() {
    _classCallCheck(this, Windows);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Windows).apply(this, arguments));
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
}(_social.Social);