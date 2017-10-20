import Kinvey from 'kinvey-phonegap-sdk';
import { NetworkRack } from 'kinvey-js-sdk/dist/export';
import angular from 'angular';
import { HttpMiddleware } from './middleware';

// Setup racks
NetworkRack.useHttpMiddleware(new HttpMiddleware());

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
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);
export default ngKinvey;
