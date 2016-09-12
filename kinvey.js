import { Kinvey } from 'kinvey-phonegap-sdk';
import { Device } from './device';
import { Popup } from './popup';

// Add Modules
Kinvey.Device = Device;
Kinvey.Popup = Popup;

// Export
export { Kinvey };
