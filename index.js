import { KinveyProvider } from './provider';
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);

// Create the kinvey module
const module = {
  name: 'kinvey'
};

// Export
export default module;
