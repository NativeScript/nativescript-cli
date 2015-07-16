import CoreObject from './object';
import StatusCode from '../enums/statusCode';
const PRIVATE_RESPONSE_SYMBOL = Symbol();

class PrivateResponse extends CoreObject {
  constructor(statusCode = StatusCode.OK, headers = {}, data = {}) {
    super();

    // Set response info
    this.statusCode = statusCode;
    this.headers = {};
    this.data = data;

    // Add headers
    this.addHeaders(headers);
  }

  getHeader(header) {
    let keys = Object.keys(this.headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];

      if (key.toLowerCase() === header.toLowerCase()) {
        return this.headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
    let headers = this.headers || {};
    headers[header] = value;
    this.headers = headers;
  }

  addHeaders(headers) {
    let keys = Object.keys(headers);

    keys.forEach((header) => {
      let value = headers[header];
      this.setHeader(header, value);
    });
  }

  isSuccess() {
    return (this.statusCode >= 200 && this.statusCode < 300);
  }

  toJSON() {
    // Create an object representing the response
    let json = {
      statusCode: this.statusCode,
      headers: this.headers,
      data: this.data
    };

    // Return the json object
    return json;
  }
}

class Response extends CoreObject {
  constructor(statusCode = StatusCode.OK, headers = {}, data = {}) {
    super();

    // Create a private response
    this[PRIVATE_RESPONSE_SYMBOL] = new PrivateResponse(statusCode, headers, data);
  }

  get statusCode() {
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
    return privateResponse.statusCode;
  }

  get data() {
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
    return privateResponse.data;
  }

  set data(data) {
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
    privateResponse.data = data;
  }

  getHeader(header) {
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
    return privateResponse.getHeader(header);
  }

  isSuccess() {
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
    return privateResponse.isSuccess();
  }

  toJSON() {
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
    return privateResponse.toJSON();
  }
}

export default Response;
