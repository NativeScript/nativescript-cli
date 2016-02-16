/* global angular:false */
import Kinvey from '../../kinvey';
import { NetworkRack } from '../../core/rack/racks/networkRack';
import { HttpMiddleware } from '../../core/rack/middleware/http';
import { AngularHttpMiddleware } from './http';
const ngKinvey = angular.module('kinvey', []);

ngKinvey.provider('$kinvey', function () {
  this.init = function (options = {}) {
    // Initialize the library
    return Kinvey.init(options);
  };

  this.$get = ['$q', '$http', function ($q, $http) {
    // Swap out the Http middleware with the Angular Http middleware
    const networkRack = NetworkRack.sharedInstance();
    networkRack.swap(HttpMiddleware, new AngularHttpMiddleware($http));

    // Replace Promise with $q
    Kinvey.Promise = $q;

    // Return the library
    return Kinvey;
  }];
});

/**
 * @private
 */
export default ngKinvey;
