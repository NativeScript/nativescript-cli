import { Kinvey } from 'kinvey-phonegap-sdk';
import { NetworkRequest, CacheRequest } from 'kinvey-javascript-sdk-core';
import { CacheRack, NetworkRack, HttpMiddleware } from './rack';
import { Device } from './device';
import { Popup } from './popup';
import angular from 'angular'; // eslint-disable-line import/no-unresolved
const $injector = angular.injector(['ng']);
const $q = $injector.get('$q');

// Set CacheRequest rack
CacheRequest.rack = new CacheRack();

// Set NetworkRequest rack
NetworkRequest.rack = new NetworkRack();

// Add Modules
Kinvey.Device = Device;
Kinvey.HttpMiddleware = HttpMiddleware;
Kinvey.Popup = Popup;
Kinvey.Promise = $q;

// Export
export { Kinvey };
