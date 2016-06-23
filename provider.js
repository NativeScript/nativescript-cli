import { Kinvey } from 'kinvey-phonegap-sdk/dist/kinvey';

// ngKinveyProvider class
export class KinveyProvider {
  init(options) {
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}
