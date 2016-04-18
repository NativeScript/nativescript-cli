'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Push = undefined;

var _events = require('events');

var _object = require('./utils/object');

var notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
var emitter = new _events.EventEmitter();

var Push = exports.Push = {
  listeners: function listeners() {
    return emitter.listeners(notificationEvent);
  },
  onNotification: function onNotification(listener) {
    return emitter.on(notificationEvent, listener);
  },
  onceNotification: function onceNotification(listener) {
    return emitter.once(notificationEvent, listener);
  },
  removeListener: function removeListener(listener) {
    return emitter.removeListener(notificationEvent, listener);
  },
  removeAllListeners: function removeAllListeners() {
    return emitter.removeAllListeners(notificationEvent);
  },
  isSupported: function isSupported() {
    return false;
  },
  register: function register() {
    throw new Error('method unsupported');
  },
  unregister: function unregister() {
    throw new Error('method unsupported');
  }
};

Push.use = (0, _object.use)(['isSupported', 'register', 'unregister']);