"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isRegistered = isRegistered;
exports.register = register;
exports.unregister = unregister;
exports.subscribeToChannel = subscribeToChannel;
exports.unsubscribeFromChannel = unsubscribeFromChannel;
exports.Listener = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _isFunction = _interopRequireDefault(require("lodash/isFunction"));

var _pubnub = _interopRequireDefault(require("pubnub"));

var _events = require("events");

var _kinvey = _interopRequireDefault(require("./errors/kinvey"));

var STATUS_PREFIX = 'status:';
var UNCLASSIFIED_EVENTS = 'pubNubEventsNotRouted';
var pubnub;
var listener;

function isValidChannelName(channelName) {
  return typeof channelName === 'string' && channelName !== '';
}

function isValidReceiver(receiver) {
  if (!receiver) {
    return false;
  }

  var onMessage = receiver.onMessage,
      onError = receiver.onError,
      onStatus = receiver.onStatus;
  return (0, _isFunction.default)(onMessage) || (0, _isFunction.default)(onError) || (0, _isFunction.default)(onStatus);
}

var Listener =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2.default)(Listener, _EventEmitter);

  function Listener() {
    (0, _classCallCheck2.default)(this, Listener);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Listener).apply(this, arguments));
  }

  (0, _createClass2.default)(Listener, [{
    key: "message",
    value: function message(m) {
      this.emit(m.channel, m);
    }
  }, {
    key: "status",
    value: function status(s) {
      var _this = this;

      var _s$affectedChannels = s.affectedChannels,
          affectedChannels = _s$affectedChannels === void 0 ? [] : _s$affectedChannels,
          _s$affectedChannelGro = s.affectedChannelGroups,
          affectedChannelGroups = _s$affectedChannelGro === void 0 ? [] : _s$affectedChannelGro;
      var allChannels = affectedChannels.concat(affectedChannelGroups);
      var data = {
        error: s.error,
        category: s.category,
        operation: s.operation
      };

      if (allChannels.length > 0) {
        allChannels.forEach(function (channelOrGroup) {
          _this.emit("".concat(STATUS_PREFIX).concat(channelOrGroup), data);
        });
      } else {
        this.emit(UNCLASSIFIED_EVENTS, data);
      }
    }
  }]);
  return Listener;
}(_events.EventEmitter);

exports.Listener = Listener;

function isRegistered() {
  return !!pubnub && !!listener;
}

function register(config) {
  if (!isRegistered()) {
    pubnub = new _pubnub.default(config);
    listener = new Listener();
    pubnub.addListener(listener);
  }
}

function unregister() {
  if (isRegistered()) {
    pubnub.unsubscribeAll();
    pubnub = null;
    listener.removeAllListeners();
    listener = null;
  }
}

function subscribeToChannel(channelName) {
  var receiver = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!isRegistered()) {
    throw new _kinvey.default('Please register for the live service before you subscribe to a channel.');
  }

  var onMessage = receiver.onMessage,
      onError = receiver.onError,
      onStatus = receiver.onStatus;

  if (!isValidChannelName(channelName)) {
    throw new Error('Invalid channel name.');
  }

  if (!isValidReceiver(receiver)) {
    throw new Error('Invalid receiver.');
  }

  if (!isRegistered()) {
    throw new Error('Please register to the Live Service before you subscribe to the channel.');
  }

  if (listener && (0, _isFunction.default)(onMessage)) {
    listener.on(channelName, onMessage);
  }

  if (listener && (0, _isFunction.default)(onError)) {
    listener.on("".concat(STATUS_PREFIX).concat(channelName), function (status) {
      if (status.error) {
        onError(status);
      }
    });
  }

  if (listener && (0, _isFunction.default)(onStatus)) {
    listener.on("".concat(STATUS_PREFIX).concat(channelName), function (status) {
      if (!status.error) {
        onStatus(status);
      }
    });
  }
}

function unsubscribeFromChannel(channelName) {
  if (listener) {
    listener.removeAllListeners(channelName);
    listener.removeAllListeners("".concat(STATUS_PREFIX).concat(channelName));
  }
}