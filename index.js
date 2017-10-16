import { NetworkRack } from 'kinvey-js-sdk/dist/export';
import { MobileIdentityConnect } from 'kinvey-js-sdk/dist/identity';
import Kinvey from 'kinvey-html5-sdk';
import { HttpMiddleware } from './middleware';
import Popup from './popup';
import Push from './push';

// Setup racks
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

// Add Push module to Kinvey
Kinvey.Push = Push;

// Export
module.exports = Kinvey;
