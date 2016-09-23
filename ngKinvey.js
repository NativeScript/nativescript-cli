import Kinvey from './kinvey';
import angular from 'angular'; // eslint-disable-line import/no-unresolved

class KinveyProvider {
  init(options) {
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}


// Create the kinvey angular module
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);
export default ngKinvey;
