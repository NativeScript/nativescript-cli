"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;
exports.formatKinveyAuthUrl = formatKinveyAuthUrl;
exports.formatKinveyBaasUrl = formatKinveyBaasUrl;
exports.KinveyRequest = exports.Request = exports.RequestMethod = void 0;

require("core-js/modules/es6.regexp.replace");

var _url = require("url");

var _kinveyApp = require("kinvey-app");

var _headers = require("./headers");

var _utils = require("./utils");

var _response = require("./response");

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

  async execute() {
    // Make http request
    const responseObject = await http({
      headers: this.headers.toObject(),
      method: this.method,
      url: this.url,
      body: (0, _utils.serialize)(this.headers.contentType, this.body)
    }); // Create a response

    const response = new _response.Response({
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

class KinveyRequest extends Request {
  constructor(request) {
    super(request);
    this.headers = request.headers;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = new _headers.KinveyHeaders(headers);
  }

}

exports.KinveyRequest = KinveyRequest;