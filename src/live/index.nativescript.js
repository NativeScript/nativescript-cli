import * as application from 'tns-core-modules/application';
import { startMonitoring, connectionType, getConnectionType } from 'tns-core-modules/connectivity';
import PubNub from 'pubnub/lib/nativescript';
import {
  isRegistered,
  reconnect,
  register as registerForLiveService,
  unregister,
  subscribeToChannel,
  unsubscribeFromChannel
} from './live';

let currentConnectionType = getConnectionType();

// Reconnect live service on the application resume event
application.on(application.resumeEvent, () => {
  if (application.ios) {
    reconnect();
  }
});

// Monitor network connectivity and reconnect live service when necessary
startMonitoring((newConnectionType) => {
  if (currentConnectionType === connectionType.none && (newConnectionType === connectionType.wifi || newConnectionType === connectionType.mobile)) {
    reconnect();
  }
  currentConnectionType = newConnectionType;
});

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
