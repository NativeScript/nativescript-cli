'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyMiddleware = undefined;

var _middleware = require('kinvey-javascript-rack/dist/middleware');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 */
var KinveyMiddleware = exports.KinveyMiddleware = function (_Middleware) {
  _inherits(KinveyMiddleware, _Middleware);

  function KinveyMiddleware() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Middleware' : arguments[0];

    _classCallCheck(this, KinveyMiddleware);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyMiddleware).call(this, name));
  }

  return KinveyMiddleware;
}(_middleware.Middleware);