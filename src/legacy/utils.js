const DataPolicy = require('../core/enums').DataPolicy;
const isFunction = require('lodash/lang/isFunction');

// Maps options from legacy library
function mapLegacyOptions(options = {}) {
  if (options.offline) {
    if (options.fallback) {
      options.dataPolicy = DataPolicy.PreferLocal;
    } else {
      options.dataPolicy = DataPolicy.ForceLocal;
    }
  } else {
    options.dataPolicy = DataPolicy.ForceNetwork;
  }

  return options;
}

// Use the fastest possible means to execute a task in a future turn of the
// event loop. Borrowed from [q](http://documentup.com/kriskowal/q/).
let nextTick;
if (typeof window !== 'undefined' && isFunction(window.setImmediate)) { // IE10, Node.js 0.9+.
  nextTick = root.setImmediate;
} else if (typeof process !== 'undefined' && process.nextTick) { // Node.js <0.9.
  nextTick = process.nextTick;
} else { // Most browsers.
  nextTick = function(fn) {
    root.setTimeout(fn, 0);
  };
}

// Wraps asynchronous callbacks so they get called when a promise fulfills or
// rejects. The `success` and `error` properties are extracted from `options`
// at run-time, allowing intermediate process to alter the callbacks.
function wrapCallbacks(promise, options = {}) {
  promise.then(function(value) {
    if (options.success) { // Invoke the success handler.
      options.success(value);
    }
  }, function(reason) {
    if (options.error) { // Invoke the error handler.
      options.error(reason);
    }
  }).then(null, function(err) {
    // If an exception occurs, the promise would normally catch it. Since we
    // are using asynchronous callbacks, exceptions should be thrown all the
    // way.
    nextTick(function() {
      throw err;
    });
  });
  return promise;
}

module.exports = {
  mapLegacyOptions: mapLegacyOptions,
  wrapCallbacks: wrapCallbacks
};
