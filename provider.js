import { Kinvey } from './kinvey';

export class KinveyProvider {
  init(options) {
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}
