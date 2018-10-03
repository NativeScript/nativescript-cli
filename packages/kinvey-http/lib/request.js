"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;
exports.formatKinveyAuthUrl = formatKinveyAuthUrl;
exports.formatKinveyBaasUrl = formatKinveyBaasUrl;
exports.KinveyRequest = exports.Auth = exports.Request = exports.RequestMethod = void 0;

require("core-js/modules/es6.regexp.replace");

var _isFunction = _interopRequireDefault(require("lodash/isFunction"));

var _url = require("url");

var _jsBase = require("js-base64");

var _kinveyApp = require("kinvey-app");

var _kinveyKmd = require("kinvey-kmd");

var _kinveySession = require("kinvey-session");

var _headers = require("./headers");

var _utils = require("./utils");

let http = async () => {
  throw new Error('You must override the default http function.');
};

function register(httpAdapter) {
  http = httpAdapter;
}

const RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
exports.RequestMethod = RequestMethod;

class Request {
  constructor(request) {
    this.headers = request.headers;
    this.method = request.method;
    this.url = request.url;
    this.body = request.body;
    this.timeout = request.timeout;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = new _headers.Headers(headers);
  }

  get body() {
    return this._body;
  }

  set body(body) {
    this._body = (0, _utils.serialize)(this.headers.contentType, body);
  }

  async execute() {
    // Make http request
    const responseObject = await http({
      headers: this.headers.toObject(),
      method: this.method,
      url: this.url,
      body: this.body
    }); // Create a response

    const response = new Response({
      statusCode: responseObject.statusCode,
      headers: responseObject.headers,
      data: responseObject.data
    }); // Handle 401
    // const response = await handle401(response);

    if (response.isSuccess()) {
      return response;
    }

    throw response.error;
  }

}

exports.Request = Request;

function getKinveyUrl(protocol, host, pathname, query) {
  const _getConfig = (0, _kinveyApp.getConfig)(),
        appKey = _getConfig.appKey;

  return (0, _url.format)({
    protocol,
    host,
    pathname: pathname.replace(/appKey/gi, appKey),
    query
  });
}

function formatKinveyAuthUrl(pathname, query) {
  const _getConfig2 = (0, _kinveyApp.getConfig)(),
        api = _getConfig2.api;

  return getKinveyUrl(api.auth.protocol, api.auth.host, pathname, query);
}

function formatKinveyBaasUrl(pathname, query) {
  const _getConfig3 = (0, _kinveyApp.getConfig)(),
        api = _getConfig3.api;

  return getKinveyUrl(api.baas.protocol, api.baas.host, pathname, query);
}

const Auth = {
  App: 'App',
  Default: 'Default',
  MasterSecret: 'MasterSecret',
  Session: 'Session'
};
exports.Auth = Auth;

class KinveyRequest extends Request {
  constructor(request) {
    super(request);
    this.headers = new _headers.KinveyHeaders(request.headers);
    this.auth = request.auth;
  }

  set auth(auth) {
    if (auth === Auth.Default) {
      try {
        this.auth = Auth.Session;
      } catch (error) {
        this.auth = Auth.MasterSecret;
      }
    }

    if ((0, _isFunction.default)(auth)) {
      const value = auth();
      this.headers.setAuthorization(value);
    } else if (auth === Auth.App) {
      const _getConfig4 = (0, _kinveyApp.getConfig)(),
            appKey = _getConfig4.appKey,
            appSecret = _getConfig4.appSecret;

      const credentials = _jsBase.Base64.encode(`${appKey}:${appSecret}`);

      this.headers.setAuthorization(`Basic ${credentials}`);
    } else if (auth === Auth.MasterSecret) {
      const _getConfig5 = (0, _kinveyApp.getConfig)(),
            appKey = _getConfig5.appKey,
            masterSecret = _getConfig5.masterSecret;

      const credentials = _jsBase.Base64.encode(`${appKey}:${masterSecret}`);

      this.headers.setAuthorization(`Basic ${credentials}`);
    } else if (auth === Auth.Session) {
      const session = (0, _kinveySession.getSession)();

      if (!session) {
        throw new Error('There is no active user to authorize the request. Please login and retry the request.');
      }

      const kmd = new _kinveyKmd.Kmd(session._kmd);
      this.headers.setAuthorization(`Kinvey ${kmd.authtoken}`);
    }
  }

}

exports.KinveyRequest = KinveyRequest;