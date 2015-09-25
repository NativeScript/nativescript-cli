import isString from 'lodash/lang/isString';
import serializer from 'localforage/src/utils/serializer';
const privateMemorySymbol = Symbol();
const store = {};

class PrivateMemory {
  constructor(options = {}) {
    this.keyPrefix = options.name + '/';
  }

  clear(done) {
    const promise = when.resolve().then(() => {
      return this.keys();
    }).then((keys) => {
      const promises = keys.map((key) => {
        return this.removeItem(key);
      });

      return when.all(promises);
    });

    this.executeCallback(promise, done);
    return promise;
  }

  getItem(key, done) {
    if (!isString(key)) {
      // TO DO: log warning
      key = String(key);
    }

    const promise = when.resolve().then(() => {
      const value = store[`${this.keyPrefix}${key}`];

      if (value) {
        value = serializer.deserialize(value);
      }

      return value;
    });

    this.executeCallback(promise, done);
    return promise;
  }

  iterate(iterator, done) {
    const promise = when.resolve().then(() => {
      const keys = Object.keys(store);
      const length = keys.length;
      const iterationNumber = 1;

      for (let i = 0; i < length; i++) {
        const key = keys[i];

        if (key.indexOf(this.keyPrefix) !== 0) {
          continue;
        }

        const value = store[key];

        if (value) {
          value = serializer.deserialize(value);
        }

        value = iterator(value, key.substring(this.keyPrefix.length), iterationNumber++);

        if (value !== void 0) {
          return value;
        }
      }
    });

    this.executeCallback(promise, done);
    return promise;
  }

  key(n, done) {
    const promise = when.resolve().then(() => {
      const keys = Object.keys(store);
      let key;

      try {
        key = keys[n];
      } catch (err) {
        key = null;
      }

      if (key) {
        key = key.substring(this.keyPrefix.length);
      }

      return key;
    });

    this.executeCallback(promise, done);
    return promise;
  }

  keys(done) {
    const promise = when.resolve().then(() => {
      const storeKeys = Object.keys(store);
      const length = storeKeys.length;
      const keys = [];

      for (let i = 0; i < length; i++) {
        const key = storeKeys[i];

        if (key.indexOf(this.keyPrefix) === 0) {
          keys.push(key.substring(this.keyPrefix.length));
        }
      }

      return keys;
    });

    this.executeCallback(promise, done);
    return promise;
  }

  length(done) {
    const promise = this.keys().then((keys) => {
      return keys.length;
    });

    this.executeCallback(promise, done);
    return promise;
  }

  removeItem(key, done) {
    if (!isString(key)) {
      // TO DO: log warning
      key = String(key);
    }

    const promise = when.resolve().then(() => {
      delete store[`${this.keyPrefix}${key}`];
    });

    this.executeCallback(promise, done);
    return promise;
  }

  setItem(key, value, done) {
    if (!isString(key)) {
      // TO DO: log warning
      key = String(key);
    }

    const promise = when.resolve().then(() => {
      if (value === undefined) {
        return null;
      }

      const originalValue = value;
      return when.promise((resolve, reject) => {
        serializer.serialize(value, (value, err) => {
          if (err) {
            return reject(err);
          }

          try {
            store[`${this.keyPrefix}${key}`] = value;
            resolve(originalValue);
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    this.executeCallback(promise, done);
    return promise;
  }

  executeCallback(promise, done) {
    if (done) {
      promise.then(function(result) {
        done(null, result);
      }, function(error) {
        done(error);
      });
    }
  }
}

export default class Memory {

  static get _driver() {
    return 'memoryStorage';
  }

  static _initStorage(options = {}) {
    Memory[privateMemorySymbol] = new PrivateMemory(options);
  }

  static iterate(iterator, done) {
    const privateMemory = Memory[privateMemorySymbol];
    return privateMemory.iterate(iterator, done);
  }

  static getItem(key, done) {
    const privateMemory = Memory[privateMemorySymbol];
    return privateMemory.getItem(key, done);
  }

  static setItem(key, value, done) {
    const privateMemory = Memory[privateMemorySymbol];
    return privateMemory.setItem(key, value, done);
  }

  static removeItem(key, done) {
    const privateMemory = Memory[privateMemorySymbol];
    return privateMemory.removeItem(key, done);
  }

  static clear(done) {
    const privateMemory = Memory[privateMemorySymbol];
    return privateMemory.clear(done);
  }

  static length(done) {
    const privateMemory = Memory[privateMemorySymbol];
    return privateMemory.length(done);
  }

  static key(n, done) {
    const privateMemory = Memory[privateMemorySymbol];
    return privateMemory.key(n, done);
  }

  static keys(done) {
    const privateMemory = Memory[privateMemorySymbol];
    return privateMemory.keys(done);
  }
}
