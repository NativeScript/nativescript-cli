import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';

import { isDefined } from '../../utils';

export default class Headers {
  constructor(headers = {}) {
    this.headers = {};
    this.addAll(headers);
  }

  get(name) {
    if (name) {
      if (isString(name) === false) {
        name = String(name);
      }

      const headers = this.headers;
      return headers[name.toLowerCase()];
    }

    return undefined;
  }

  set(name, value) {
    if (isDefined(name) === false || isDefined(value) === false) {
      throw new Error('A name and value must be provided to set a header.');
    }

    if (isString(name) === false) {
      name = String(name);
    }

    const headers = this.headers;
    name = name.toLowerCase();

    if (isString(value) === false) {
      headers[name] = JSON.stringify(value);
    } else {
      headers[name] = value;
    }

    this.headers = headers;
    return this;
  }

  has(name) {
    return !!this.get(name);
  }

  add(header = {}) {
    return this.set(header.name, header.value);
  }

  addAll(headers = {}) {
    if (headers instanceof Headers) {
      headers = headers.toPlainObject();
    }

    if (isPlainObject(headers) === false) {
      throw new Error('Headers argument must be an object.');
    }

    const names = Object.keys(headers);
    forEach(names, (name) => {
      try {
        this.set(name, headers[name]);
      } catch (error) {
        // Catch the error
      }
    });
    return this;
  }

  remove(name) {
    if (name) {
      if (isString(name) === false) {
        name = String(name);
      }

      const headers = this.headers;
      delete headers[name.toLowerCase()];
      this.headers = headers;
    }

    return this;
  }

  clear() {
    this.headers = {};
    return this;
  }

  toPlainObject() {
    return this.headers;
  }

  toString() {
    return JSON.stringify(this.toPlainObject());
  }
}
