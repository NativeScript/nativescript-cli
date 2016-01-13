/* global angular:false */
const Kinvey = require('../../kinvey');
const NetworkRack = require('../../core/rack/networkRack');
const Http = require('../../core/rack/http');
const AngularHttp = require('./http');
const ngKinvey = angular.module('kinvey', []);

ngKinvey.provider('$kinvey', function () {
  this.init = function (options = {}) {
    // Initialize the library
    return Kinvey.init(options);
  };

  this.initialize = function (options = {}) {
    return this.init(options);
  };

  this.$get = ['$q', '$http', function ($q, $http) {
    // Swap out the Http middleware with the AngularHttp middleware
    const networkRack = NetworkRack.sharedInstance();
    networkRack.swap(Http, new AngularHttp($http));

    // Replace Http with AngularHttp
    Kinvey.Rack.Http = AngularHttp;

    // Replace Defer with $q
    Kinvey.Defer = $q;

    // Return the library
    return Kinvey;
  }];
});

module.exports = ngKinvey;
