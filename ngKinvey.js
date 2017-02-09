import Kinvey from 'kinvey-phonegap-sdk';
import { ParseMiddleware, SerializeMiddleware } from 'kinvey-node-sdk/dist/export';
import { HttpMiddleware } from './middleware';
import angular from 'angular'; // eslint-disable-line import/no-unresolved

// Setup racks
Kinvey.NetworkRack.reset();
Kinvey.NetworkRack.use(new SerializeMiddleware());
Kinvey.NetworkRack.use(new HttpMiddleware());
Kinvey.NetworkRack.use(new ParseMiddleware());

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
