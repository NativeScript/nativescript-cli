const isString = require('lodash/lang/isString');
const StatusCode = require('./enums/statusCode');

class Response {
  constructor(statusCode = StatusCode.OK, headers = {}, data) {
    this.statusCode = statusCode;
    this.addHeaders(headers);
    this.data = data;
  }

  getHeader(header) {
    if (!isString(header)) {
      header = String(header);
    }

    const keys = Object.keys(this.headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];

      if (key.toLowerCase() === header.toLowerCase()) {
        return this.headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
    if (!isString(header)) {
      header = String(header);
    }

    if (!isString(value)) {
      value = String(value);
    }

    const headers = this.headers || {};
    headers[header.toLowerCase()] = value;
    this.headers = headers;
  }

  addHeaders(headers) {
    const keys = Object.keys(headers);

    keys.forEach((header) => {
      const value = headers[header];
      this.setHeader(header, value);
    });
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
