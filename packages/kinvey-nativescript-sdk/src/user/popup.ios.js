"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = open;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _isFunction = _interopRequireDefault(require("lodash/isFunction"));

var _color = require("tns-core-modules/color");

var _utils = require("tns-core-modules/utils/utils");

var _nativescriptUrlhandler = require("nativescript-urlhandler");

var EventEmitter = require('events');

var LOADED_EVENT = 'loaded';
var CLOSED_EVENT = 'closed';
var ERROR_EVENT = 'error';

var SFSafariViewControllerDelegateImpl =
/*#__PURE__*/
function (_NSObject) {
  (0, _inherits2.default)(SFSafariViewControllerDelegateImpl, _NSObject);

  function SFSafariViewControllerDelegateImpl() {
    (0, _classCallCheck2.default)(this, SFSafariViewControllerDelegateImpl);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(SFSafariViewControllerDelegateImpl).apply(this, arguments));
  }

  (0, _createClass2.default)(SFSafariViewControllerDelegateImpl, [{
    key: "safariViewControllerDidFinish",
    value: function safariViewControllerDidFinish() {
      if ((0, _isFunction.default)(this._callback)) {
        this._callback(true);
      }
    }
  }], [{
    key: "initWithOwnerCallback",
    value: function initWithOwnerCallback(owner, callback) {
      var delegate = SFSafariViewControllerDelegateImpl.new();
      delegate.ObjCProtocols = [SFSafariViewControllerDelegate];
      delegate._owner = owner;
      delegate._callback = callback;
      return delegate;
    }
  }]);
  return SFSafariViewControllerDelegateImpl;
}(NSObject);

var Popup =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2.default)(Popup, _EventEmitter);

  function Popup() {
    (0, _classCallCheck2.default)(this, Popup);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Popup).apply(this, arguments));
  }

  (0, _createClass2.default)(Popup, [{
    key: "isClosed",
    value: function isClosed() {
      return this._open !== true;
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
    key: "open",
    value: function open(url) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      // Handle redirect uri
      (0, _nativescriptUrlhandler.handleOpenURL)(function (appURL) {
        _this.emit(LOADED_EVENT, {
          url: appURL.toString()
        });
      }); // Create a SafariViewController

      var sfc = SFSafariViewController.alloc().initWithURL(NSURL.URLWithString(url)); // Toolbar color

      if (options.toolbarColor) {
        sfc.preferredBarTintColor = new _color.Color(options.toolbarColor).ios;
      } // Delegate


      sfc.delegate = SFSafariViewControllerDelegateImpl.initWithOwnerCallback(new WeakRef(this), function (finish) {
        if (finish) {
          // Set open to false
          _this._open = false; // Emit the exit event

          _this.emit(CLOSED_EVENT);
        }
      }); // Show the view controller

      var app = _utils.ios.getter(UIApplication, UIApplication.sharedApplication);

      this._viewController = app.keyWindow.rootViewController; // Get the topmost view controller

      while (this._viewController.presentedViewController) {
        this._viewController = this._viewController.presentedViewController;
      }

      this._viewController.presentViewControllerAnimatedCompletion(sfc, true, null); // Set open to true


      this._open = true; // Return this

      return this;
    }
  }, {
    key: "close",
    value: function close() {
      if (this._open && this._viewController) {
        this._viewController.dismissViewControllerAnimatedCompletion(true, null);

        this._viewController = null;
        this._open = false;
      }

      this.emit(CLOSED_EVENT);
      return this;
    }
  }]);
  return Popup;
}(EventEmitter);

function open(url, options) {
  var popup = new Popup();
  return popup.open(url, options);
}