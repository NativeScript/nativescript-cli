import { Kinvey } from 'kinvey-phonegap-sdk';
import { HttpMiddleware } from './rack';
import { Device } from './device';
import { Popup } from './popup';
import { Promise } from 'es6-promise';

// Add Modules
Kinvey.Device = Device;
Kinvey.Popup = Popup;
Kinvey.Promise = Promise;
Kinvey.HttpMiddleware = HttpMiddleware;

// Export
export { Kinvey };
