'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Popup = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _device = require('./device');

var _events = require('events');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _bind = require('lodash/bind');

var _bind2 = _interopRequireDefault(_bind);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


var Popup = exports.Popup = function (_EventEmitter) {
  _inherits(Popup, _EventEmitter);

  function Popup() {
    _classCallCheck(this, Popup);

    return _possibleConstructorReturn(this, (Popup.__proto__ || Object.getPrototypeOf(Popup)).apply(this, arguments));
  }

  _createClass(Popup, [{
    key: 'open',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var _this2 = this;

        var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var interval, eventListeners, popupWindow, titaniumWebView, titaniumCloseButton, clickHandler, loadStartCallback, loadStopCallback, loadErrorCallback, exitCallback, _titaniumWebView, tiWindow;

        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                interval = void 0;
                eventListeners = void 0;
                popupWindow = void 0;
                titaniumWebView = void 0;
                titaniumCloseButton = void 0;

                // Wait for the device to be ready if this is a Cordova environment

                if (!(typeof global.cordova !== 'undefined')) {
                  _context.next = 10;
                  break;
                }

                _context.next = 8;
                return _device.Device.ready();

              case 8:
                if (!(typeof global.cordova.InAppBrowser === 'undefined')) {
                  _context.next = 10;
                  break;
                }

                throw new Error('Cordova InAppBrowser Plugin is not installed.' + ' Please refer to https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-inappbrowser' + ' for help with installing the InAppBrowser plugin.');

              case 10:

                // clickHandler
                clickHandler = function clickHandler() {
                  popupWindow.close();
                };

                // loadStartCallback


                loadStartCallback = function loadStartCallback(event) {
                  _this2.emit('loadstart', event);
                };

                // loadStopCallback


                loadStopCallback = function loadStopCallback(event) {
                  _this2.emit('loadstop', event);
                };

                // loadErrorCallback


                loadErrorCallback = function loadErrorCallback(event) {
                  _this2.emit('error', event);
                };

                // exitCallback


                exitCallback = function exitCallback() {
                  // Clear the interval
                  clearInterval(interval);

                  // Close the popup
                  popupWindow.close();
                  _this2.popupWindow = null;

                  // Remove event listeners
                  if (popupWindow && (0, _isFunction2.default)(popupWindow.removeEventListener)) {
                    popupWindow.removeEventListener('loadstart', eventListeners.loadStopCallback);
                    popupWindow.removeEventListener('loadstop', eventListeners.loadStopCallback);
                    popupWindow.removeEventListener('loaderror', eventListeners.loadErrorCallback);
                    popupWindow.removeEventListener('close', eventListeners.exitCallback);
                    popupWindow.removeEventListener('androidback', eventListeners.exitCallback);
                    popupWindow.removeEventListener('exit', eventListeners.exitCallback);
                  }

                  if (titaniumWebView && (0, _isFunction2.default)(titaniumWebView.removeEventListener)) {
                    titaniumWebView.removeEventListener('load', eventListeners.loadHandler);
                    titaniumWebView.removeEventListener('error', eventListeners.loadHandler);
                  }

                  if (titaniumCloseButton && (0, _isFunction2.default)(titaniumCloseButton.removeEventListener)) {
                    titaniumCloseButton.removeEventListener('click', eventListeners.clickHandler);
                  }

                  // Emit closed
                  _this2.emit('closed');
                };

                // Bind event listeners


                eventListeners = {
                  clickHandler: (0, _bind2.default)(clickHandler, this),
                  loadStartCallback: (0, _bind2.default)(loadStartCallback, this),
                  loadStopCallback: (0, _bind2.default)(loadStopCallback, this),
                  loadErrorCallback: (0, _bind2.default)(loadErrorCallback, this),
                  exitCallback: (0, _bind2.default)(exitCallback, this)
                };

                // Create popup window for Titanium

                if (!(typeof global.Titanium !== 'undefined' && typeof global.Titanium.UI !== 'undefined')) {
                  _context.next = 27;
                  break;
                }

                _titaniumWebView = global.Titanium.UI.createWebView({
                  width: '100%',
                  height: '100%',
                  url: url
                });

                _titaniumWebView.addEventListener('load', eventListeners.loadStopCallback);
                _titaniumWebView.addEventListener('error', eventListeners.loadErrorCallback);

                popupWindow = global.Titanium.UI.createWindow({
                  backgroundColor: 'white',
                  barColor: '#000',
                  title: options.title || 'Kinvey Mobile Identity Connect',
                  modal: true
                });
                popupWindow.add(_titaniumWebView);

                if (global.Titanium.Platform.osname === 'iphone' || global.Titanium.Platform.osname === 'ipad') {
                  tiWindow = global.Titanium.UI.createWindow({
                    backgroundColor: 'white',
                    barColor: '#e3e3e3',
                    title: options.title || 'Kinvey Mobile Identity Connect'
                  });

                  tiWindow.add(_titaniumWebView);

                  titaniumCloseButton = global.Titanium.UI.createButton({
                    title: 'Close',
                    style: global.Titanium.UI.iPhone.SystemButtonStyle.DONE
                  });
                  tiWindow.setLeftNavButton(titaniumCloseButton);
                  titaniumCloseButton.addEventListener('click', eventListeners.clickHandler);

                  popupWindow = global.Titanium.UI.iOS.createNavigationWindow({
                    backgroundColor: 'white',
                    window: tiWindow,
                    modal: true
                  });
                } else if (global.Titanium.Platform.osname === 'android') {
                  popupWindow.addEventListener('androidback', eventListeners.exitCallback);
                }

                // Open the popup
                popupWindow.addEventListener('close', eventListeners.exitCallback);
                popupWindow.open();
                _context.next = 34;
                break;

              case 27:
                // Open the popup
                popupWindow = global.open(url, '_blank', 'location=yes');

                if (!popupWindow) {
                  _context.next = 33;
                  break;
                }

                if ((0, _isFunction2.default)(popupWindow.addEventListener)) {
                  popupWindow.addEventListener('loadstart', eventListeners.loadStartCallback);
                  popupWindow.addEventListener('loadstop', eventListeners.loadStopCallback);
                  popupWindow.addEventListener('loaderror', eventListeners.loadErrorCallback);
                  popupWindow.addEventListener('exit', eventListeners.exitCallback);
                }

                // Check if the popup is closed has closed every 100ms
                if (typeof global.cordova === 'undefined') {
                  interval = setInterval(function () {
                    if (popupWindow.closed) {
                      eventListeners.exitCallback();
                    } else {
                      try {
                        eventListeners.loadStopCallback({
                          url: popupWindow.location.href
                        });
                      } catch (error) {
                        // Just catch the error
                      }
                    }
                  }, 100);
                }
                _context.next = 34;
                break;

              case 33:
                throw new Error('The popup was blocked.');

              case 34:

                // Set the popupWindow instance
                this.popupWindow = popupWindow;

                // Return this
                return _context.abrupt('return', this);

              case 36:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function open(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return open;
    }()
  }, {
    key: 'close',
    value: function close() {
      if (this.popupWindow) {
        this.popupWindow.close();
      }

      return this;
    }
  }]);

  return Popup;
}(_events.EventEmitter);