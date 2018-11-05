import * as application from 'tns-core-modules/application';
import { getLiveService } from '../core/live';
const connectivityModule = require('tns-core-modules/connectivity');
let currentConnectionType = connectivityModule.getConnectionType();

// Reconnect live service on the application resume event
application.on(application.resumeEvent, () => {
  const liveService = getLiveService();
  if (liveService && liveService.isInitialized()) {
    if (application.ios) {
      liveService._pubnubClient.reconnect();
    }
  }
});

// Monitor network connectivity and reconnect live service when necessary
connectivityModule.startMonitoring((newConnectionType) => {
  if (currentConnectionType === connectivityModule.connectionType.none && (newConnectionType === connectivityModule.connectionType.wifi || newConnectionType === connectivityModule.connectionType.mobile)) {
    const liveService = getLiveService();

    if (liveService && liveService.isInitialized()) {
      liveService._pubnubClient.reconnect();
    }
  }

  currentConnectionType = newConnectionType;
});
