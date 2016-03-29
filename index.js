import { Kinvey } from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/src/rack/rack';
import { SerializeMiddleware } from 'kinvey-javascript-sdk-core/src/rack/middleware/serialize';
import { HttpMiddleware } from './http';
import { Device } from 'kinvey-javascript-sdk-core/src/utils/device';
import { DeviceAdapter } from './device';
import { Popup } from 'kinvey-javascript-sdk-core/src/utils/popup';
import { PopupAdapter } from './popup';
import { Push } from './push';

// Add Http middleware
const networkRack = NetworkRack.sharedInstance();
networkRack.useAfter(SerializeMiddleware, new HttpMiddleware());

// Use Device Adapter
Device.use(new DeviceAdapter());

// Use Popup Adapter
Popup.use(new PopupAdapter());

// Add Push module
Kinvey.Push = Push;

// Export
module.exports = Kinvey;
