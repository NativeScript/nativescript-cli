import 'regenerator-runtime/runtime';
import KinveyProvider from './provider';
import { NetworkRack } from 'kinvey-javascript-sdk-core/es5/rack/rack';
import { HttpMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware/http';
import { AngularHttpMiddleware } from './http';
import { AngularDevice } from './device';
import { AngularPopup } from './popup';

// Add the Http Middleware to the network rack
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(HttpMiddleware, new AngularHttpMiddleware());

// Expose globals
global.KinveyDevice = AngularDevice;
global.KinveyPopup = AngularPopup;

// Register the SDK as a provider
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);
