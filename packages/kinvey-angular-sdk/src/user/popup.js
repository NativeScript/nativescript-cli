"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = open;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var EventEmitter = require('events');

var LOADED_EVENT = 'loaded';
var CLOSED_EVENT = 'closed';
var ERROR_EVENT = 'error';

var Popup =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2.default)(Popup, _EventEmitter);

  function Popup(popupWindow) {
    var _this;

    (0, _classCallCheck2.default)(this, Popup);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Popup).call(this));
    _this.popupWindow = popupWindow;
    _this.interval = window.setInterval(function () {
      if (popupWindow.closed) {
        _this.close();
      } else {
        try {
          var event = {
            url: popupWindow.location.href
          };

          _this.emit(LOADED_EVENT, event);
        } catch (error) {
          if (error.code !== window.DOMException.SECURITY_ERR) {
            _this.emit(ERROR_EVENT, error);
          }
        }
      }
    }, 100);
    return _this;
  }

  (0, _createClass2.default)(Popup, [{
    key: "isClosed",
    value: function isClosed() {
      return this.popupWindow.closed;
    }
  }, {
    key: "onLoaded",
    value: function onLoaded(listener) {
      return this.on(LOADED_EVENT, listener);
    }
  }, {
    key: "onClosed",
    value: function onClosed(listener) {
      return this.on(CLOSED_EVENT, listener);
    }
  }, {
    key: "onError",
    value: function onError(listener) {
      return this.on(ERROR_EVENT, listener);
    }
  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee() {
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.interval) {
                  window.clearInterval(this.interval);
                  this.interval = null;
                }

                if (this.popupWindow && !this.popupWindow.closed) {
                  this.popupWindow.close();
                  this.popupWindow = null;
                }

                this.emit(CLOSED_EVENT);
                return _context.abrupt("return", this);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function close() {
        return _close.apply(this, arguments);
      }

      return close;
    }()
  }], [{
    key: "open",
    value: function open(url) {
      var popupWindow = window.open(url, '_blank', 'toolbar=no,location=no');

      if (!popupWindow) {
        throw new Error('The popup was blocked.');
      }

      return new Popup(popupWindow);
    }
  }]);
  return Popup;
}(EventEmitter);

function open(url) {
  return Popup.open(url);
}