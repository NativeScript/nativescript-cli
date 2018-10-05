"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyHeaders = exports.Auth = exports.Headers = void 0;

require("core-js/modules/web.dom.iterable");

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isFunction = _interopRequireDefault(require("lodash/isFunction"));

var _jsBase = require("js-base64");

var _kinveyApp = require("kinvey-app");

var _kinveyKmd = require("kinvey-kmd");

var _kinveySession = require("kinvey-session");

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
    const key = name.toLowerCase();

    if (!(0, _isString.default)(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    if (!(0, _isString.default)(value) && !(0, _isArray.default)(value) && !(0, _isFunction.default)(value) || (0, _isArray.default)(value) && value.some(isNotString)) {
      throw new Error('Please provide a value. Value must be a string or an array that contains only strings.');
    }

    if ((0, _isArray.default)(value)) {
      this.headers.set(key, value.join(','));
    } else if ((0, _isFunction.default)(value)) {
      const val = value();
      return this.set(name, val);
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

exports.Headers = Headers;
const Auth = {
  App: 'App',
  Default: 'Default',
  MasterSecret: 'MasterSecret',
  Session: 'Session'
};
exports.Auth = Auth;

class KinveyHeaders extends Headers {
  constructor(headers) {
    super(headers); // Add the Accept header

    if (!this.has('Accept')) {
      this.set('Accept', 'application/json; charset=utf-8');
    } // Add Content-Type header


    if (!this.has('Content-Type')) {
      this.set('Content-Type', 'application/json; charset=utf-8');
    } // Add the X-Kinvey-API-Version header


    if (!this.has('X-Kinvey-Api-Version')) {
      this.set('X-Kinvey-Api-Version', '4');
    }
  }

  get requestStart() {
    return this.get(X_KINVEY_REQUEST_START_HEADER);
  }

  set(name, value) {
    if (name.toLowerCase() === AUTHORIZATION_HEADER.toLowerCase()) {
      const auth = value;

      if (auth === Auth.Default) {
        try {
          return this.set(name, Auth.Session);
        } catch (error) {
          return this.set(name, Auth.MasterSecret);
        }
      }

      if (auth === Auth.App) {
        const _getConfig = (0, _kinveyApp.getConfig)(),
              appKey = _getConfig.appKey,
              appSecret = _getConfig.appSecret;

        const credentials = _jsBase.Base64.encode(`${appKey}:${appSecret}`);

        return super.set(name, `Basic ${credentials}`);
      } else if (auth === Auth.MasterSecret) {
        const _getConfig2 = (0, _kinveyApp.getConfig)(),
              appKey = _getConfig2.appKey,
              masterSecret = _getConfig2.masterSecret;

        const credentials = _jsBase.Base64.encode(`${appKey}:${masterSecret}`);

        return super.set(name, `Basic ${credentials}`);
      } else if (auth === Auth.Session) {
        const session = (0, _kinveySession.get)();

        if (!session) {
          throw new Error('There is no active user to authorize the request. Please login and retry the request.');
        }

        const kmd = new _kinveyKmd.Kmd(session._kmd);
        return super.set(name, `Kinvey ${kmd.authtoken}`);
      }
    }

    return super.set(name, value);
  }

}

exports.KinveyHeaders = KinveyHeaders;