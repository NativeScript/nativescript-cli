import * as Kinvey from './bundle';

class KinveyProvider {
  init(options = {}) {
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}

// Create the kinvey angular module
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);
module.exports = ngKinvey;
