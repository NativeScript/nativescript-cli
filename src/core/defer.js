import CoreObject from './object';

class Defer extends CoreObject {
  constructor(fn) {
    super();

    this.promise = new Promise((resolve, reject) => {
      fn(resolve, reject);
    });
  }

  then(resolvefn, rejectFn) {
    return this.promise.then(resolvefn, rejectFn);
  }

  static all(promises) {
    return Promise.all(promises);
  }

  static race(promises) {
    return Promise.race(promises);
  }

  static resolve(value) {
    return Promise.resolve(value);
  }

  static reject(reason) {
    return Promise.reject(reason);
  }
}

export default Defer;
