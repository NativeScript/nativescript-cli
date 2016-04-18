import { EventEmitter } from 'events';
import { use } from './object';
const loadedEvent = process.env.KINVEY_POPUP_LOADED_EVENT || 'loaded';
const closedEvent = process.env.KINVEY_POPUP_CLOSED_EVENT || 'closed';
const emitter = new EventEmitter();

/**
 * @private
 */
export const Popup = {
  listeners(event = '') {
    return emitter.listeners(event);
  },

  onLoaded(listener) {
    return emitter.on(loadedEvent, listener);
  },

  onceLoaded(listener) {
    return emitter.once(loadedEvent, listener);
  },

  onClosed(listener) {
    return emitter.on(closedEvent, listener);
  },

  onceClosed(listener) {
    return emitter.once(closedEvent, listener);
  },

  removeAllListeners() {
    return emitter.removeAllListeners();
  },

  open() {
    throw new Error('method unsupported');
  },

  close() {
    throw new Error('method unsupported');
  },

  loadHandler() {
    throw new Error('method unsupported');
  },

  clickHandler() {
    throw new Error('method unsupported');
  },

  closeHandler() {
    throw new Error('method unsupported');
  },
};

Popup.use = use(['open', 'close', 'loadHandler', 'clickHandler', 'closeHandler']);
