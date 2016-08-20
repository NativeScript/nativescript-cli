import { KinveyProvider } from './provider';
import { KinveyError } from 'kinvey-javascript-sdk-core/dist/errors';
import {
  CacheMiddleware as CoreCacheMiddleware,
  HttpMiddleware as CoreHttpMiddleware,
  KinveyRackManager
} from 'kinvey-javascript-sdk-core/dist/rack';
import { CacheMiddleware } from 'kinvey-phonegap-sdk/dist/cache';
import { HttpMiddleware } from './http';
import { Device } from './device';
import { Popup } from './popup';
import angular from 'angular'; // eslint-disable-line import/no-unresolved

// Swap Cache Middelware
const cacheRack = KinveyRackManager.cacheRack;
cacheRack.swap(CoreCacheMiddleware, new CacheMiddleware());

// Swap Http middleware
const networkRack = KinveyRackManager.networkRack;
networkRack.swap(CoreHttpMiddleware, new HttpMiddleware());

// Check that the cordova device plugin is installed
Device.ready().then(() => {
  if (Device.isPhoneGap() && typeof global.device === 'undefined') {
    throw new KinveyError('Cordova Device Plugin is not installed.'
    + ' Please refer to devcenter.kinvey.com/phonegap-v3.0/guides/getting-started for help with'
    + ' setting up your project.');
  }
});

// Expose globals
global.KinveyDevice = Device;
global.KinveyPopup = Popup;

// Create the kinvey angular module
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);

// Export
module.exports = ngKinvey;
