import { KinveyProvider } from './provider';
import { Device } from './device';
import { Popup } from './popup';
import angular from 'angular'; // eslint-disable-line import/no-unresolved

// Create the kinvey angular module
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);

// Expose globals
global.Kinvey = global.Kinvey || {};
global.Kinvey.Device = Device;
global.Kinvey.Popup = Popup;

// Export
module.exports = ngKinvey;
