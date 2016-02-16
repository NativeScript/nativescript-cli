"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createQueryablePromise = createQueryablePromise;
/**
 * @private
 */
function createQueryablePromise(promise) {
  // Don't create a wrapper for promises that can already be queried.
  if (promise.isResolved) return promise;

  var isResolved = false;
  var isRejected = false;

  // Observe the promise, saving the fulfillment in a closure scope.
  var result = promise.then(function (v) {
    isResolved = true;return v;
  }, function (e) {
    isRejected = true;throw e;
  });
  result.isFulfilled = function () {
    return isResolved || isRejected;
  };
  result.isResolved = function () {
    return isResolved;
  };
  result.isRejected = function () {
    return isRejected;
  };
  return result;
}