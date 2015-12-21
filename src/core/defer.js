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
    const future = {};
    future.promise = new Promise((resolve, reject) => {
      future.resolve = resolve;
      future.reject = reject;
    });
    return future;
  }
}

module.exports = Defer;
