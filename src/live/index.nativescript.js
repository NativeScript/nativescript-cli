import * as application from 'tns-core-modules/application';
import { startMonitoring, connectionType, getConnectionType } from 'tns-core-modules/connectivity';
import { isRegistered, reconnect, register, unregister, subscribeToChannel, unsubscribeFromChannel } from './live';

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

// Export
export {
  isRegistered,
  register,
  unregister,
  subscribeToChannel,
  unsubscribeFromChannel
};
