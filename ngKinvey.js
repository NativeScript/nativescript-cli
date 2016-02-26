/* global angular:false */
import { Kinvey } from 'kinvey-sdk-core';
import { NetworkRack } from 'kinvey-sdk-core/src/rack/racks/networkRack';
import { HttpMiddleware } from 'kinvey-sdk-core/src/rack/middleware/http';
import { ngHttpMiddleware } from './ngHttpMiddleware';
const ngKinvey = angular.module('kinvey', []);

ngKinvey.provider('$kinvey', function () {
  this.init = function (options = {}) {
    // Initialize the library
    return Kinvey.init(options);
  };

  this.$get = ['$q', '$http', function ($q, $http) {
    /* eslint-disable new-cap */
    // Swap out the Http middleware with the Angular Http middleware
    const networkRack = NetworkRack.sharedInstance();
    networkRack.swap(HttpMiddleware, new ngHttpMiddleware($http));
    /* eslint-enable new-cap */

    // Replace Promise with $q
    Kinvey.Promise = $q;

    // Return the library
    return Kinvey;
  }];
});
