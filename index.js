import { KinveyProvider } from './provider';
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);

const Kinvey = {
  name: 'kinvey'
};

// Export
module.exports = Kinvey;
