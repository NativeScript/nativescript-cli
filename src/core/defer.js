const Promise = require('bluebird');

const Defer = {
  all: function all(promises = []) {
    return Promise.all(promises);
  },

  resolve: function resolve(value) {
    return Promise.resolve(value);
  },

  reject: function reject(reason) {
    return Promise.reject(reason);
  },

  defer: function defer() {
    const future = {};
    future.promise = new Promise((resolve, reject) => {
      future.resolve = resolve;
      future.reject = reject;
    });
    return future;
  }
};

module.exports = Defer;
