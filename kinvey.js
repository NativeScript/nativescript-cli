import { Kinvey as PhoneGapKinvey } from 'kinvey-phonegap-sdk/dist/kinvey';
import angular from 'angular'; // eslint-disable-line import/no-unresolved
const $injector = angular.injector(['ng']);

export class Kinvey extends PhoneGapKinvey {
  /**
   * Returns the Promise class.
   *
   * @return {Promise} The Promise class.
   *
   * @example
   * var Promise = Kinvey.Promise;
   */
  static get Promise() {
    return $injector.get('$q');
  }
}
