"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyHeaders = exports.Headers = void 0;

require("core-js/modules/web.dom.iterable");

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _isString = _interopRequireDefault(require("lodash/isString"));

const AUTHORIZATION_HEADER = 'Authorization';
const X_KINVEY_REQUEST_START_HEADER = 'X-Kinvey-Request-Start';

function isNotString(val) {
  return !(0, _isString.default)(val);
}
/**
 * @private
 */


class Headers {
  constructor(headers) {
    this.headers = new Map();
    this.normalizedNames = new Map();

    if (headers) {
      if (headers instanceof Headers) {
        headers.keys().forEach(header => {
          const value = headers.get(header);
          this.set(header, value);
        });
      } else {
        Object.keys(headers).forEach(header => {
          const value = headers[header];
          this.set(header, value);
        });
      }
    }
  }

  get contentType() {
    return this.get('Content-Type');
  }

  has(name) {
    if (!(0, _isString.default)(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.has(name.toLowerCase());
  }

  get(name) {
    if (!(0, _isString.default)(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.get(name.toLowerCase());
  }

  keys() {
    return Array.from(this.normalizedNames.values());
  }

  set(name, value) {
    if (!(0, _isString.default)(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    if (!(0, _isString.default)(value) && !(0, _isArray.default)(value) || (0, _isArray.default)(value) && value.some(isNotString)) {
      throw new Error('Please provide a value. Value must be a string or an array that contains only strings.');
    }

    const key = name.toLowerCase();

    if ((0, _isArray.default)(value)) {
      this.headers.set(key, value.join(','));
    } else {
      this.headers.set(key, value);
    }

    if (!this.normalizedNames.has(key)) {
      this.normalizedNames.set(key, name);
    }

    return this;
  }

  join(headers) {
    if (headers instanceof Headers) {
      headers.keys().forEach(header => {
        const value = headers.get(header);
        this.set(header, value);
      });
    } else {
      Object.keys(headers).forEach(header => {
        const value = headers[header];
        this.set(header, value);
      });
    }

    return this;
  }

  delete(name) {
    if (!(0, _isString.default)(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.delete(name.toLowerCase());
  }

  toObject() {
    return this.keys().reduce((headers, header) => {
      // eslint-disable-next-line no-param-reassign
      headers[header] = this.get(header);
      return headers;
    }, {});
  }

}
/**
 * @private
 */


exports.Headers = Headers;

class KinveyHeaders extends Headers {
  constructor(headers) {
    super(headers); // Add the Accept header

    if (!this.has('Accept')) {
      this.set('Accept', 'application/json; charset=utf-8');
    } // Add the X-Kinvey-API-Version header


    if (!this.has('X-Kinvey-Api-Version')) {
      this.set('X-Kinvey-Api-Version', '4');
    }
  }

  get requestStart() {
    return this.get(X_KINVEY_REQUEST_START_HEADER);
  }

  setAuthorization(value) {
    this.set(AUTHORIZATION_HEADER, value);
  }

}

exports.KinveyHeaders = KinveyHeaders;