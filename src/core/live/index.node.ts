import PubNub from 'pubnub/lib/node';
import {
  isRegistered,
  register as registerForLiveService,
  unregister,
  subscribeToChannel,
  unsubscribeFromChannel
} from './live';

// Register
export function register(config) {
  const pubnub = new PubNub(Object.assign({}, { ssl: true, dedupeOnSubscribe: true }, config));
  pubnub.subscribe({ channelGroups: [config.userChannelGroup] });
  registerForLiveService(pubnub);
  return true;
}

// Export
export {
  isRegistered,
  unregister,
  subscribeToChannel,
  unsubscribeFromChannel
};

