'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Popup = undefined;

var _events = require('events');

var _object = require('./object');

var loadedEvent = process.env.KINVEY_POPUP_LOADED_EVENT || 'loaded';
var closedEvent = process.env.KINVEY_POPUP_CLOSED_EVENT || 'closed';
var emitter = new _events.EventEmitter();

/**
 * @private
 */
var Popup = exports.Popup = {
  listeners: function listeners() {
    var event = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    return emitter.listeners(event);
  },
  onLoaded: function onLoaded(listener) {
    return emitter.on(loadedEvent, listener);
  },
  onceLoaded: function onceLoaded(listener) {
    return emitter.once(loadedEvent, listener);
  },
  onClosed: function onClosed(listener) {
    return emitter.on(closedEvent, listener);
  },
  onceClosed: function onceClosed(listener) {
    return emitter.once(closedEvent, listener);
  },
  removeAllListeners: function removeAllListeners() {
    return emitter.removeAllListeners();
  },
  open: function open() {
    throw new Error('method unsupported');
  },
  close: function close() {
    throw new Error('method unsupported');
  },
  loadHandler: function loadHandler() {
    throw new Error('method unsupported');
  },
  clickHandler: function clickHandler() {
    throw new Error('method unsupported');
  },
  closeHandler: function closeHandler() {
    throw new Error('method unsupported');
  }
};

Popup.use = (0, _object.use)(['open', 'close', 'loadHandler', 'clickHandler', 'closeHandler']);