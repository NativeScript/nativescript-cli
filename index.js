import { KinveyProvider } from './provider';
const ngKinvey = angular.module('kinvey', []);
ngKinvey.provider('$kinvey', KinveyProvider);

const module = {
  name: 'kinvey'
};
export default module;
