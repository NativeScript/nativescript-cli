import * as SDK from './index';

// Hoist Kinvey properties to the top
const Kinvey = Object.assign(SDK, SDK.Kinvey);
delete Kinvey.Kinvey;

// KinveyProvider
class KinveyProvider {
  init(options = {}) {
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}

// Create the kinvey angular module
const ngKinvey = global.angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);
export default ngKinvey;
