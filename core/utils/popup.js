'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _device = require('../device');

var _device2 = _interopRequireDefault(_device);

var _events = require('events');

var _bind = require('lodash/bind');

var _bind2 = _interopRequireDefault(_bind);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* global Titanium:false */


var privatePopupSymbol = Symbol();

/**
 * @private
 */

var PrivatePopup = function (_EventEmitter) {
  _inherits(PrivatePopup, _EventEmitter);

  function PrivatePopup() {
    var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];

    _classCallCheck(this, PrivatePopup);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PrivatePopup).call(this));

    _this.url = url;
    _this.eventListeners = {
      loadHandler: (0, _bind2.default)(_this.loadHandler, _this),
      clickHandler: (0, _bind2.default)(_this.clickHandler, _this),
      closeHandler: (0, _bind2.default)(_this.closeHandler, _this)
    };
    return _this;
  }

  _createClass(PrivatePopup, [{
    key: 'open',
    value: function open() {
      var _this2 = this;

      var device = new _device2.default();
      var promise = new Promise(function (resolve, reject) {
        if (device.isCordova()) {
          _this2.popup = global.open(_this2.url, '_blank', 'location=yes');

          if (_this2.popup) {
            _this2.popup.addEventListener('loadstart', _this2.eventListeners.loadHandler);
            _this2.popup.addEventListener('exit', _this2.eventListeners.closeHandler);
          } else {
            reject(new Error('The popup was blocked.'));
          }
        } else if (device.isTitanium()) {
          _this2.tiWebView = Titanium.UI.createWebView({
            width: '100%',
            height: '100%',
            url: _this2.url
          });

          _this2.popup = Titanium.UI.createWindow({
            backgroundColor: 'white',
            barColor: '#000',
            title: 'Mobile Identity Connect',
            modal: true
          });
          _this2.popup.add(_this2.tiWebView);

          if (device.os.name === 'ios') {
            _this2.tiWin = Titanium.UI.createWindow({
              backgroundColor: 'white',
              barColor: '#e3e3e3',
              title: 'Mobile Identity Connect'
            });
            _this2.tiWin.add(_this2.tiWebView);

            _this2.tiCloseButton = Titanium.UI.createButton({
              title: 'Close',
              style: Titanium.UI.iPhone.SystemButtonStyle.DONE
            });
            _this2.tiWin.setLeftNavButton(_this2.tiCloseButton);
            _this2.tiCloseButton.addEventListener('click', _this2.eventListeners.clickHandler);

            _this2.popup = Titanium.UI.iOS.createNavigationWindow({
              backgroundColor: 'white',
              window: _this2.tiWin,
              modal: true
            });
          } else if (device.os.name === 'android') {
            _this2.popup.addEventListener('androidback', _this2.eventListeners.closeHandler);
          }

          _this2.tiWebView.addEventListener('load', _this2.eventListeners.loadHandler);
          _this2.tiWebView.addEventListener('error', _this2.eventListeners.loadHandler);
          _this2.popup.addEventListener('close', _this2.eventListeners.closeHandler);

          _this2.popup.open();
        } else {
          _this2.popup = global.open(_this2.url, '_blank', 'toolbar=no,location=no');

          if (_this2.popup) {
            _this2.interval = setInterval(function () {
              if (_this2.popup.closed) {
                _this2.closeHandler();
              } else {
                try {
                  _this2.loadHandler({
                    url: _this2.popup.location.href
                  });
                } catch (e) {
                  // catch any errors due to cross domain issues
                }
              }
            }, 100);
          } else {
            reject(new Error('The popup was blocked.'));
          }
        }

        resolve();
      });

      return promise;
    }
  }, {
    key: 'close',
    value: function close() {
      var _this3 = this;

      var promise = new Promise(function (resolve) {
        _this3.popup.close();
        resolve();
      });
      return promise;
    }
  }, {
    key: 'loadHandler',
    value: function loadHandler(event) {
      this.emit('load', event.url);
    }
  }, {
    key: 'clickHandler',
    value: function clickHandler() {
      this.close();
    }
  }, {
    key: 'closeHandler',
    value: function closeHandler() {
      var device = new _device2.default();
      clearTimeout(this.interval);

      if (device.isCordova()) {
        this.popup.removeEventListener('loadstart', this.eventListeners.loadHandler);
        this.popup.removeEventListener('exit', this.eventListeners.closeHander);
      } else if (device.isTitanium()) {
        this.tiWebView.removeEventListener('load', this.eventListeners.loadHandler);
        this.tiWebView.removeEventListener('error', this.eventListeners.loadHandler);
        this.popup.removeEventListener('close', this.eventListeners.closeHandler);

        if (device.os.name === 'ios') {
          this.tiCloseButton.removeEventListener('click', this.eventListeners.clickHandler);
        } else if (device.os.name === 'android') {
          this.popup.close();
          this.popup.removeEventListener('androidback', this.eventListeners.closeHandler);
        }
      }

      this.emit('close');
    }
  }]);

  return PrivatePopup;
}(_events.EventEmitter);

/**
 * @private
 */


var Popup = function () {
  function Popup(url) {
    _classCallCheck(this, Popup);

    this[privatePopupSymbol] = new PrivatePopup(url);
  }

  _createClass(Popup, [{
    key: 'listenerCount',
    value: function listenerCount(type) {
      return this[privatePopupSymbol].listenerCount(type);
    }
  }, {
    key: 'listeners',
    value: function listeners(event) {
      return this[privatePopupSymbol].listeners(event);
    }
  }, {
    key: 'getMaxListeners',
    value: function getMaxListeners() {
      return this[privatePopupSymbol].getMaxListeners();
    }
  }, {
    key: 'setMaxListeners',
    value: function setMaxListeners(n) {
      return this[privatePopupSymbol].setMaxListeners(n);
    }
  }, {
    key: 'addListener',
    value: function addListener(event, listener) {
      return this[privatePopupSymbol].addListener(event, listener);
    }
  }, {
    key: 'on',
    value: function on(event, listener) {
      return this[privatePopupSymbol].on(event, listener);
    }
  }, {
    key: 'once',
    value: function once(event, listener) {
      return this[privatePopupSymbol].once(event, listener);
    }
  }, {
    key: 'emit',
    value: function emit(event) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return this[privatePopupSymbol].emit(event, args);
    }
  }, {
    key: 'removeAllListeners',
    value: function removeAllListeners(event) {
      return this[privatePopupSymbol].removeAllListeners(event);
    }
  }, {
    key: 'removeListener',
    value: function removeListener(event, listener) {
      return this[privatePopupSymbol].removeListener(event, listener);
    }
  }, {
    key: 'open',
    value: function open() {
      var _this4 = this;

      return this[privatePopupSymbol].open().then(function () {
        return _this4;
      });
    }
  }, {
    key: 'close',
    value: function close() {
      var _this5 = this;

      return this[privatePopupSymbol].close().then(function () {
        return _this5;
      });
    }
  }, {
    key: 'url',
    get: function get() {
      return this[privatePopupSymbol].url;
    },
    set: function set(url) {
      this[privatePopupSymbol].url = url;
    }
  }]);

  return Popup;
}();

exports.default = Popup;