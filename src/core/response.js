import CoreObject from './object';
import StatusCode from '../enums/statusCode';
<<<<<<< Updated upstream
const PRIVATE_RESPONSE_SYMBOL = Symbol();
=======
const privateResponseSymbol = Symbol();
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    let keys = Object.keys(this.headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];
=======
    const keys = Object.keys(this.headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
>>>>>>> Stashed changes

      if (key.toLowerCase() === header.toLowerCase()) {
        return this.headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
<<<<<<< Updated upstream
    let headers = this.headers || {};
=======
    const headers = this.headers || {};
    header = header.toLowerCase();
>>>>>>> Stashed changes
    headers[header] = value;
    this.headers = headers;
  }

  addHeaders(headers) {
<<<<<<< Updated upstream
    let keys = Object.keys(headers);

    keys.forEach((header) => {
      let value = headers[header];
=======
    const keys = Object.keys(headers);

    keys.forEach((header) => {
      const value = headers[header];
>>>>>>> Stashed changes
      this.setHeader(header, value);
    });
  }

  isSuccess() {
<<<<<<< Updated upstream
    return (this.statusCode >= 200 && this.statusCode < 300);
=======
    return this.statusCode >= 200 && this.statusCode < 300;
>>>>>>> Stashed changes
  }

  toJSON() {
    // Create an object representing the response
<<<<<<< Updated upstream
    let json = {
=======
    const json = {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    this[PRIVATE_RESPONSE_SYMBOL] = new PrivateResponse(statusCode, headers, data);
  }

  get statusCode() {
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
=======
    this[privateResponseSymbol] = new PrivateResponse(statusCode, headers, data);
  }

  get statusCode() {
    const privateResponse = this[privateResponseSymbol];
>>>>>>> Stashed changes
    return privateResponse.statusCode;
  }

  get data() {
<<<<<<< Updated upstream
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
=======
    const privateResponse = this[privateResponseSymbol];
>>>>>>> Stashed changes
    return privateResponse.data;
  }

  set data(data) {
<<<<<<< Updated upstream
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
=======
    const privateResponse = this[privateResponseSymbol];
>>>>>>> Stashed changes
    privateResponse.data = data;
  }

  getHeader(header) {
<<<<<<< Updated upstream
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
=======
    const privateResponse = this[privateResponseSymbol];
>>>>>>> Stashed changes
    return privateResponse.getHeader(header);
  }

  isSuccess() {
<<<<<<< Updated upstream
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
=======
    const privateResponse = this[privateResponseSymbol];
>>>>>>> Stashed changes
    return privateResponse.isSuccess();
  }

  toJSON() {
<<<<<<< Updated upstream
    let privateResponse = this[PRIVATE_RESPONSE_SYMBOL];
=======
    const privateResponse = this[privateResponseSymbol];
>>>>>>> Stashed changes
    return privateResponse.toJSON();
  }
}

export default Response;
