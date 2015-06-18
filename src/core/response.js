import CoreObject from './object';
import utils from './utils';

class Response extends CoreObject {
  constructor(statusCode = 200, headers = {}, data = {}) {
    super();

    // Set request env
    this.statusCode = statusCode;
    this.addHeaders(headers);
    this.data = data;
  }

  get headers() {
    return utils.clone(this._headers);
  }

  getHeader(header) {
    let keys = Object.keys(this._headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];

      if (key.toLowerCase() === header.toLowerCase()) {
        return this._headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
    let headers = this._headers || {};
    headers[header] = value;
    this._headers = headers;
  }

  addHeaders(headers) {
    let keys = Object.keys(headers);

    keys.forEach((header) => {
      let value = headers[header];
      this.setHeader(header, value);
    });
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

export default Response;
