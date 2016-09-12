import { Kinvey as Html5Kinvey } from 'kinvey-html5-sdk';
import { Device } from './device';
import { Popup } from './popup';
import { Push } from './push';

class Kinvey extends Html5Kinvey {
  static init(options) {
    // Initialize Kinvey
    const client = super.init(options);

    // Add Push module to Kinvey
    this.Push = new Push();

    // Return the client
    return client;
  }
}

// Add modules
Kinvey.Device = Device;
Kinvey.Popup = Popup;

// Export
export { Kinvey };
