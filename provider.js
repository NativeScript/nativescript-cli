import { Kinvey } from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/src/rack/rack';
import { SerializeMiddleware } from 'kinvey-javascript-sdk-core/src/rack/middleware/serialize';
import { HttpMiddleware } from './http';
import { Popup } from 'kinvey-javascript-sdk-core/src/utils/popup';
import { PopupAdapter } from './popup';
import { Device } from 'kinvey-javascript-sdk-core/src/utils/device';
import { DeviceAdapter } from './device';

export class KinveyProvider {
  constructor() {
    // Use Http middleware after the Serialize middleware
    const networkRack = NetworkRack.sharedInstance();
    networkRack.useAfter(SerializeMiddleware, new HttpMiddleware());

    // Use Device Adapter
    Device.use(new DeviceAdapter());

    // Use Popup Adapter
    Popup.use(new PopupAdapter());
  }

  init(options = {}) {
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}
