import isFunction from 'lodash/isFunction';
import { EventEmitter } from 'events';
import { getConfig, ConfigKey } from './config';
import { KinveyError } from './errors';

const STATUS_PREFIX = 'status:';
const UNCLASSIFIED_EVENTS = 'pubNubEventsNotRouted';

export interface LiveServiceReceiver {
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onStatus?: (status: any) => void;
}

function isValidChannelName(channelName: string) {
  return (typeof channelName === 'string') && channelName !== '';
}

function isValidReceiver(receiver: LiveServiceReceiver) {
  if (!receiver) {
    return false;
  }
  const { onMessage, onError, onStatus } = receiver;
  return isFunction(onMessage) || isFunction(onError) || isFunction(onStatus);
}

class Listener extends EventEmitter {
  message(m: any) {
    this.emit(m.channel, m.message);
  }

  status(s: any) {
    const { affectedChannels = [], affectedChannelGroups = [] } = s;
    const allChannels = affectedChannels.concat(affectedChannelGroups);
    const data = {
      error: s.error,
      category: s.category,
      operation: s.operation
    };

    if (allChannels.length > 0) {
      allChannels.forEach((channelOrGroup: any) => {
        this.emit(`${STATUS_PREFIX}${channelOrGroup}`, data);
      });
    } else {
      this.emit(UNCLASSIFIED_EVENTS, data);
    }
  }
}

const listener = new Listener();
let pubnub: any | null;

export function isSubscribed(channelName?: string) {
  if (pubnub) {
    if (channelName) {
      return listener.eventNames().indexOf(channelName) !== -1;
    }

    return true;
  }

  return false;
}

export function subscribe(config: any) {
  if (pubnub) {
    throw new KinveyError('You are already subscribed to the live service. Please unsubscribe before you subscribe again.');
  }

  const PubNub: any = getConfig(ConfigKey.PubNub);
  pubnub = new PubNub(Object.assign({}, { ssl: true, dedupeOnSubscribe: true }, config));
  pubnub.subscribe({ channelGroups: [config.userChannelGroup] });
  pubnub.addListener(listener);
}

export function subscribeToChannel(channelName: string, receiver: LiveServiceReceiver = {}) {
  const { onMessage, onError, onStatus } = receiver;

  if (!isValidChannelName(channelName)) {
    throw new Error('Invalid channel name.');
  }

  if (!isValidReceiver(receiver)) {
    throw new Error('Invalid receiver.');
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

  return true;
}

export function unsubscribeFromChannel(channelName?: string) {
  listener.removeAllListeners(channelName);
  listener.removeAllListeners(`${STATUS_PREFIX}${channelName}`);
  return true;
}

export function unsubscribe() {
  unsubscribeFromChannel();

  if (pubnub) {
    pubnub.removeListener(listener);
    pubnub.destroy();
    pubnub = null;
  }

  return true;
}
