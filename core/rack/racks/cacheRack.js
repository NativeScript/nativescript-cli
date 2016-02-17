'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheRack = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rack = require('../rack');

var _cache = require('../middleware/cache');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var sharedInstanceSymbol = Symbol();

/**
 * @private
 */

var CacheRack = exports.CacheRack = function (_KinveyRack) {
  _inherits(CacheRack, _KinveyRack);

  function CacheRack() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Cache Rack' : arguments[0];

    _classCallCheck(this, CacheRack);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheRack).call(this, name));

    _this.use(new _cache.CacheMiddleware());
    return _this;
  }

  _createClass(CacheRack, null, [{
    key: 'sharedInstance',
    value: function sharedInstance() {
      var instance = CacheRack[sharedInstanceSymbol];

      if (!instance) {
        instance = new CacheRack();
        CacheRack[sharedInstanceSymbol] = instance;
      }

      return instance;
    }
  }]);

  return CacheRack;
}(_rack.KinveyRack);