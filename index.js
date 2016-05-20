import KinveyProvider from './provider';

// Register the SDK as a provider
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);

