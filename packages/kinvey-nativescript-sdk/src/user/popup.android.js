"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = open;

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _color = require("tns-core-modules/color");

var _frame = require("tns-core-modules/ui/frame");

var app = _interopRequireWildcard(require("tns-core-modules/application"));

var _page = require("tns-core-modules/ui/page");

var _gridLayout = require("tns-core-modules/ui/layouts/grid-layout");

var _stackLayout = require("tns-core-modules/ui/layouts/stack-layout");

var _webView = require("tns-core-modules/ui/web-view");

var _nativescriptUrlhandler = require("nativescript-urlhandler");

var EventEmitter = require('events');

var LOADED_EVENT = 'loaded';
var CLOSED_EVENT = 'closed'; // const ERROR_EVENT = 'error';

var customtabs = android.support.customtabs || {};
var CustomTabsCallback = customtabs.CustomTabsCallback;
var CustomTabsServiceConnection = customtabs.CustomTabsServiceConnection;
var CustomTabsIntent = customtabs.CustomTabsIntent;
var CustomTabsClient = customtabs.CustomTabsClient;
var Uri = android.net.Uri; // export interface PopupOptions {
//   toolbarColor?: string;
//   showTitle?: boolean;
// }

var NavigationEvent = {
  Started: 1,
  Finished: 2,
  Failed: 3,
  Aborted: 4,
  TabShown: 5,
  TabHidden: 6
};

var OAuthPageProvider =
/*#__PURE__*/
function () {
  function OAuthPageProvider(authUrl, webviewIntercept) {
    (0, _classCallCheck2.default)(this, OAuthPageProvider);
    this.authUrl = authUrl;
    this.webviewIntercept = webviewIntercept;
  }

  (0, _createClass2.default)(OAuthPageProvider, [{
    key: "createWebViewPage",
    value: function createWebViewPage() {
      var _this = this;

      var webview = new _webView.WebView();
      webview.on(_webView.WebView.loadFinishedEvent, function (args) {
        _this.webviewIntercept(webview, args.error, args.url);
      });
      webview.on(_webView.WebView.loadStartedEvent, function (args) {
        _this.webviewIntercept(webview, args.error, args.url);
      });
      var grid = new _gridLayout.GridLayout();
      grid.addChild(webview);
      var stack = new _stackLayout.StackLayout();
      stack.addChild(grid);
      var page = new _page.Page();
      page.content = stack;
      webview.src = this.authUrl;
      return page;
    }
  }]);
  return OAuthPageProvider;
}();

var LegacyPopup =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2.default)(LegacyPopup, _EventEmitter);

  function LegacyPopup() {
    (0, _classCallCheck2.default)(this, LegacyPopup);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(LegacyPopup).apply(this, arguments));
  }

  (0, _createClass2.default)(LegacyPopup, [{
    key: "open",
    value: function open() {
      var _this2 = this;

      var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';

      if (this._open !== true) {
        var webViewIntercept = function webViewIntercept(webview, error, url) {
          var urlStr = '';

          try {
            if (error && error.userInfo && error.userInfo.allValues && error.userInfo.allValues.count > 0) {
              var val0 = error.userInfo.allValues[0];

              if (val0.absoluteString) {
                urlStr = val0.absoluteString;
              } else if (val0.userInfo && val0.userInfo.allValues && val0.userInfo.allValues.count > 0) {
                urlStr = val0.userInfo.allValues[0];
              } else {
                urlStr = val0;
              }
            } else if (webview.request && webview.request.URL && webview.request.URL.absoluteString) {
              urlStr = webview.request.URL.absoluteString;
            } else if (url) {
              urlStr = url;
            }
          } catch (ex) {// Just catch the exception
          }

          _this2.emit(LOADED_EVENT, {
            url: urlStr
          });

          return true;
        };

        var authPage = new OAuthPageProvider(url, webViewIntercept);
        (0, _frame.topmost)().navigate(function () {
          return authPage.createWebViewPage();
        });
        this._open = true;
      }

      return this;
    }
  }]);
  return LegacyPopup;
}(EventEmitter);

var Popup =
/*#__PURE__*/
function (_EventEmitter2) {
  (0, _inherits2.default)(Popup, _EventEmitter2);

  function Popup() {
    (0, _classCallCheck2.default)(this, Popup);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Popup).apply(this, arguments));
  }

  (0, _createClass2.default)(Popup, [{
    key: "open",
    value: function open(url) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (this._open !== true) {
        var activity = app.android.startActivity || app.android.foregroundActivity;
        var shouldClose = false;
        var success = false;

        try {
          var callback = CustomTabsCallback.extend({
            onNavigationEvent: function onNavigationEvent(navigationEvent) {
              switch (navigationEvent) {
                case NavigationEvent.Finished:
                case NavigationEvent.Failed:
                case NavigationEvent.Aborted:
                  if (shouldClose) {
                    setTimeout(function () {
                      _this3.emit(CLOSED_EVENT);
                    }, 0);
                  }

                  break;

                case NavigationEvent.TabHidden:
                  shouldClose = true;
                  _this3._open = false;
                  break;
              }
            }
          }); // Handle redirect uri

          (0, _nativescriptUrlhandler.handleOpenURL)(function (appURL) {
            _this3.emit(LOADED_EVENT, {
              url: appURL.toString()
            });
          });
          var serviceConnection = CustomTabsServiceConnection.extend({
            onCustomTabsServiceConnected: function onCustomTabsServiceConnected(name, client) {
              // Create a new session
              var session = client.newSession(new callback()); // Create a new intent builder

              var intentBuilder = new CustomTabsIntent.Builder(session); // Toolbar color

              if (options.toolbarColor) {
                intentBuilder.setToolbarColor(new _color.Color(options.toolbarColor).android);
              } // Show title


              if (options.showTitle) {
                intentBuilder.setShowTitle(options.showTitle);
              }

              intentBuilder.addDefaultShareMenuItem(); // Adds a default share item to the menu.

              intentBuilder.enableUrlBarHiding(); // Enables the url bar to hide as the user scrolls down on the page.
              // Launch the url

              var intent = intentBuilder.build();
              intent.launchUrl(activity, Uri.parse(url)); // Set open to true

              _this3._open = true;
            },
            onServiceDisconnected: function onServiceDisconnected(name) {// TODO: Do nothing for now. Should this change?
            }
          }); // Bind to the custom tabs service

          success = CustomTabsClient.bindCustomTabsService(activity, 'com.android.chrome', new serviceConnection());
        } catch (error) {}

        if (!success) {
          var legacyPopup = new LegacyPopup();
          legacyPopup.on(LOADED_EVENT, function (event) {
            return _this3.emit(LOADED_EVENT, event);
          });
          legacyPopup.open(url);
          this._open = true;
        }
      } // Return this


      return this;
    }
  }, {
    key: "close",
    value: function close() {
      if (this._open === true) {
        (0, _frame.topmost)().goBack();
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