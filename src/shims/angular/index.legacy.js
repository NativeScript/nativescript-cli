/* global angular:false */
const Kinvey = require('../../legacy/kinvey');
const Rack = require('../../rack/rack');
const Http = require('../../rack/http');
const AngularHttp = require('./http');
const ngKinvey = angular.module('kinvey', []);

ngKinvey.provider('$kinvey', function () {
  this.init = function (options = {}) {
    // Initialize the library
    return Kinvey.init(options);
  };

  this.$get = ['$q', '$http', function ($q, $http) {
    // Swap out the Http middleware with the AngularHttp middleware
    const networkRack = Rack.networkRack;
    networkRack.swap(Http, new AngularHttp($http));
    Rack.networkRack = networkRack;

    // Replace Http with AngularHttp
    Kinvey.Rack.Http = AngularHttp;

    // Replace Defer with $q
    Kinvey.Defer = $q;

    // Return the library
    return Kinvey;
  }];
});

module.exports = ngKinvey;
