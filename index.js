import 'regenerator-runtime/runtime';
import KinveyProvider from './provider';
import { KinveyError } from 'kinvey-javascript-sdk-core/dist/errors';
import { CacheRack, NetworkRack } from 'kinvey-javascript-sdk-core/dist/rack/rack';
import { CacheMiddleware as CoreCacheMiddleware } from 'kinvey-javascript-sdk-core/dist/rack/middleware/cache';
import { CacheMiddleware } from './cache';
import { HttpMiddleware as CoreHttpMiddleware } from 'kinvey-javascript-sdk-core/dist/rack/middleware/http';
import { HttpMiddleware } from './http';
import { Device } from './device';
import { Popup } from './popup';

// Swap Cache Middelware
const cacheRack = CacheRack.sharedInstance();
cacheRack.swap(CoreCacheMiddleware, new CacheMiddleware());

// Add the Http Middleware to the network rack
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(CoreHttpMiddleware, new HttpMiddleware());

// Check that the device plugin is installed
if (Device.isPhoneGap()) {
  const onDeviceReady = () => {
    document.removeEventListener('deviceready', onDeviceReady);

    if (typeof global.device === 'undefined') {
      throw new KinveyError('Cordova Device Plugin is not installed.'
        + ' Please refer to devcenter.kinvey.com/phonegap-v3.0/guides/getting-started for help with'
        + ' setting up your project.');
    }
  };

  document.addEventListener('deviceready', onDeviceReady, false);
}

// Expose globals
global.KinveyDevice = Device;
global.KinveyPopup = Popup;

// Register the SDK as a provider
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);
