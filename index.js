import 'regenerator-runtime/runtime';
import KinveyProvider from './provider';
import { KinveyError } from 'kinvey-javascript-sdk-core/es5/errors';
import { NetworkRack } from 'kinvey-javascript-sdk-core/es5/rack/rack';
import { HttpMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware/http';
import { AngularHttpMiddleware } from './http';
import { AngularDevice } from './device';
import { AngularPopup } from './popup';

// Add the Http Middleware to the network rack
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(HttpMiddleware, new AngularHttpMiddleware());

// Check that the device plugin is installed
if (AngularDevice.isPhoneGap()) {
  const onDeviceReady = () => {
    document.removeEventListener('deviceready', onDeviceReady);

    if (typeof global.device === 'undefined') {
      throw new KinveyError('Cordova Device Plugin is not installed.',
        'Please refer to http://devcenter.kinvey.com/phonegap-v3.0/guides/push#ProjectSetUp for help with'
        + ' setting up your project.');
    }
  };

  document.addEventListener('deviceready', onDeviceReady, false);
}

// Expose globals
global.KinveyDevice = AngularDevice;
global.KinveyPopup = AngularPopup;

// Register the SDK as a provider
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);
