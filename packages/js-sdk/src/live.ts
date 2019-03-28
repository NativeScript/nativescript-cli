import isFunction from 'lodash/isFunction';
import { EventEmitter } from 'events';
import PubNub from 'pubnub';

const STATUS_PREFIX = 'status:';
const UNCLASSIFIED_EVENTS = 'pubNubEventsNotRouted';

let listener;

interface KinveyPubNub extends PubNub {
  reconnect(): void;
}

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

export class Live {
  public pubnub: PubNub;
  public listener: Listener;

  constructor(config: any) {
    this.pubnub = new PubNub(Object.assign({}, { ssl: true, dedupeOnSubscribe: true }, config));
    this.pubnub.subscribe({ channelGroups: [config.userChannelGroup] });
    this.listener = new Listener();
    this.pubnub.addListener(this.listener);
  }

  subscribeToChannel(channelName: string, receiver: LiveServiceReceiver = {}) {
    const { onMessage, onError, onStatus } = receiver;

    if (!isValidChannelName(channelName)) {
      throw new Error('Invalid channel name.');
    }

    if (!isValidReceiver(receiver)) {
      throw new Error('Invalid receiver.');
    }

    if (isFunction(onMessage)) {
      this.listener.on(channelName, onMessage);
    }

    if (isFunction(onError)) {
      this.listener.on(`${STATUS_PREFIX}${channelName}`, (status) => {
        if (status.error) {
          onError(status);
        }
      });
    }

    if (isFunction(onStatus)) {
      this.listener.on(`${STATUS_PREFIX}${channelName}`, (status) => {
        if (!status.error) {
          onStatus(status);
        }
      });
    }

    return true;
  }

  unsubscribeFromChannel(channelName: string) {
    this.listener.removeAllListeners(channelName);
    this.listener.removeAllListeners(`${STATUS_PREFIX}${channelName}`);
    return true;
  }
}
