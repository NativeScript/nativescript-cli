import * as application from 'tns-core-modules/application';
import { getLiveService } from '../core/live';
const connectivityModule = require('tns-core-modules/connectivity');

// Reconnect live service on the application resume event
application.on(application.resumeEvent, (args) => {
  const liveService = getLiveService();
  if (liveService && liveService.isInitialized()) {
    liveService._pubnubClient.reconnect();
  }
});

// Monitor network connectivity and reconnect live service when necessary
connectivityModule.startMonitoring((newConnectionType) => {
  const liveService = getLiveService();
  switch (newConnectionType) {
    case connectivityModule.connectionType.wifi:
    case connectivityModule.connectionType.mobile:
      if (liveService && liveService.isInitialized()) {
        liveService._pubnubClient.reconnect();
      }
      break;
  }
});
