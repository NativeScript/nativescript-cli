/**
 * Copyright 2013 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Deferreds.
// ----------

// Helper function to translate a `Kinvey.Defer` to a Backbone compatible
// promise. This helper is necessary because jQuery “promises” are
// [not really](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/)
// promises. If Backbone relies on Zepto, return the Kinvey promise as Zepto
// does not have the concept of deferreds.
var kinveyToBackbonePromise = function(kinveyPromise, options) {
  // Backbone expects multiple arguments as part of the resolve or reject
  // handler. Add these here.
  var promise = kinveyPromise.then(function(value) {
    var args = options.xhr ? [ options.xhr.statusText, options.xhr ] : [];
    return [value].concat(args);
  }, function(reason) {
    var args = options.xhr ? [ options.xhr.statusText, options.xhr ] : [null, null];
    return Kinvey.Defer.reject(args.concat([reason]));
  });

  // If Backbone does not rely on jQuery, return the Kinvey promise.
  if('undefined' === typeof jQuery || 'undefined' === typeof jQuery.Deferred) {
    return promise;
  }

  // Convert the Kinvey promise into a jQuery deferred and return it.
  var deferred = jQuery.Deferred();
  promise.then(function(args) {
    deferred.resolve.apply(deferred, args);
  }, function(args) {
    deferred.reject.apply(deferred, args);
  });
  return deferred.promise();
};