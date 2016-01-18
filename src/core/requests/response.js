const StatusCode = require('../enums').StatusCode;
const assign = require('lodash/object/assign');
const forEach = require('lodash/collection/forEach');
const isString = require('lodash/lang/isString');
const isPlainObject = require('lodash/lang/isPlainObject');

class Response {
  constructor(options = {}) {
    options = assign({
      statusCode: StatusCode.Ok,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      data: null
    }, options);

    this.statusCode = options.statusCode;
    this.addHeaders(options.headers);
    this.data = options.data;
  }

  getHeader(name) {
    if (name) {
      if (!isString(name)) {
        name = String(name);
      }

      const headers = this.headers || {};
      const keys = Object.keys(headers);

      for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];

        if (key.toLowerCase() === name.toLowerCase()) {
          return headers[key];
        }
      }
    }

    return undefined;
  }

  setHeader(name, value) {
    if (!name || !value) {
      throw new Error('A name and value must be provided to set a header.');
    }

    if (!isString(name)) {
      name = String(name);
    }

    const headers = this.headers || {};

    if (!isString(value)) {
      headers[name] = JSON.stringify(value);
    } else {
      headers[name] = value;
    }

    this.headers = headers;
  }

  addHeaders(headers) {
    if (!isPlainObject(headers)) {
      throw new Error('Headers argument must be an object.');
    }

    const names = Object.keys(headers);

    forEach(names, name => {
      const value = headers[name];
      this.setHeader(name, value);
    });
  }

  removeHeader(name) {
    if (name) {
      if (!isString(name)) {
        name = String(name);
      }

      const headers = this.headers || {};
      delete headers[name];
      this.headers = headers;
    }
  }

  clearHeaders() {
    this.headers = {};
  }

  isSuccess() {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  toJSON() {
    const json = {
      statusCode: this.statusCode,
      headers: this.headers,
      data: this.data
    };
    return json;
  }
}

module.exports = Response;
