const Promise = require('bluebird');

class Defer {
  static all(promises = []) {
    return Promise.all(promises);
  }

  static resolve(value) {
    return Promise.resolve(value);
  }

  static reject(reason) {
    return Promise.reject(reason);
  }

  static deferred() {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  }
}

module.exports = Defer;
