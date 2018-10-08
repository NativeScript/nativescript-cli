import isFunction from 'lodash/isFunction';
import PubNub from 'pubnub';
import { EventEmitter } from 'events';

const STATUS_PREFIX = 'status:';
const UNCLASSIFIED_EVENTS = 'pubNubEventsNotRouted';

let pubnub;
let listener;

function isValidChannelName(channelName) {
  return (typeof channelName === 'string') && channelName !== '';
}

function isValidReceiver(receiver) {
  if (!receiver) {
    return false;
  }
  const { onMessage, onError, onStatus } = receiver;
  return isFunction(onMessage) || isFunction(onError) || isFunction(onStatus);
}

class Listener extends EventEmitter {
  message(m) {
    this.emit(m.channel, m);
  }

  status(s) {
    const { affectedChannels = [], affectedChannelGroups = [] } = s;
    const allChannels = affectedChannels.concat(affectedChannelGroups);
    const data = {
      error: s.error,
      category: s.category,
      operation: s.operation
    };

    if (allChannels.length > 0) {
      allChannels.forEach((channelOrGroup) => {
        this.emit(`${STATUS_PREFIX}${channelOrGroup}`, data);
      });
    } else {
      this.emit(UNCLASSIFIED_EVENTS, data);
    }
  }
}

export function isRegistered() {
  return !!pubnub && !!listener;
}

export function register(config) {
  if (!isRegistered()) {
    pubnub = new PubNub(config);
    listener = new Listener();
    pubnub.addListener(listener);
  }
  return this;
}

export function unregister() {
  if (isRegistered()) {
    pubnub.unsubscribeAll();
    pubnub = null;
    listener.removeAllListeners();
    listener = null;
  }
}

export function subscribeToChannel(channelName, receiver = {}) {
  const { onMessage, onError, onStatus } = receiver;

  if (!isValidChannelName(channelName)) {
    throw new Error('Invalid channel name.');
  }

  if (!isValidReceiver(receiver)) {
    throw new Error('Invalid receiver.');
  }

  if (!isRegistered()) {
    throw new Error('Please register to the Live Service before you subscribe to the channel.');
  }

  if (isFunction(onMessage)) {
    listener.on(channelName, onMessage);
  }

  if (isFunction(onError)) {
    listener.on(`${STATUS_PREFIX}${channelName}`, (status) => {
      if (status.error) {
        onError(status);
      }
    });
  }

  if (isFunction(onStatus)) {
    listener.on(`${STATUS_PREFIX}${channelName}`, (status) => {
      if (!status.error) {
        onStatus(status);
      }
    });
  }
}

export function unsubscribeFromChannel(channelName) {
  listener.removeAllListeners(channelName);
  listener.removeAllListeners(`${STATUS_PREFIX}${channelName}`);
}
