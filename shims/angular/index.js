'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _kinvey = require('../../kinvey');

var _kinvey2 = _interopRequireDefault(_kinvey);

var _networkRack = require('../../core/rack/racks/networkRack');

var _http = require('../../core/rack/middleware/http');

var _http2 = require('./http');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global angular:false */

var ngKinvey = angular.module('kinvey', []);

ngKinvey.provider('$kinvey', function () {
  this.init = function () {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    // Initialize the library
    return _kinvey2.default.init(options);
  };

  this.$get = ['$q', '$http', function ($q, $http) {
    // Swap out the Http middleware with the Angular Http middleware
    var networkRack = _networkRack.NetworkRack.sharedInstance();
    networkRack.swap(_http.HttpMiddleware, new _http2.AngularHttpMiddleware($http));

    // Replace Promise with $q
    _kinvey2.default.Promise = $q;

    // Return the library
    return _kinvey2.default;
  }];
});

/**
 * @private
 */
exports.default = ngKinvey;