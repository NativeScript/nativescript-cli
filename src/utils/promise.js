/**
 * @private
 */
export function createQueryablePromise(promise) {
  // Don't create a wrapper for promises that can already be queried.
  if (promise.isResolved) return promise;

  let isResolved = false;
  let isRejected = false;

  // Observe the promise, saving the fulfillment in a closure scope.
  const result = promise.then(
     function(v) { isResolved = true; return v; },
     function(e) { isRejected = true; throw e; });
  result.isFulfilled = function() { return isResolved || isRejected; };
  result.isResolved = function() { return isResolved; };
  result.isRejected = function() { return isRejected; };
  return result;
}
