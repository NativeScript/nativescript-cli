import { KinveyProvider } from './provider';
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);

export default {
  name: 'kinvey'
};
