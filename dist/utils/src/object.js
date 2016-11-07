'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nested = nested;
exports.isDefined = isDefined;
exports.use = use;

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isNull = require('lodash/isNull');

var _isNull2 = _interopRequireDefault(_isNull);

var _isUndefined = require('lodash/isUndefined');

var _isUndefined2 = _interopRequireDefault(_isUndefined);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function nested(obj, dotProperty, value) {
  if (!dotProperty) {
    obj = value || obj;
    return obj;
  }

  var parts = dotProperty.split('.');
  var current = parts.shift();
  while (current && obj) {
    obj = obj[current];
    current = parts.shift();
  }

  return value || obj;
}

function isDefined(obj) {
  return !(0, _isUndefined2.default)(obj) && !(0, _isNull2.default)(obj);
}

function use(nsInterface) {
  return function () {
    var _this = this;

    var adapter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    (0, _forEach2.default)(nsInterface, function (methodName) {
      if ((0, _isFunction2.default)(adapter[methodName])) {
        _this.prototype[methodName] = function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return adapter[methodName].apply(this, args);
        };
      }
    });
  };
}