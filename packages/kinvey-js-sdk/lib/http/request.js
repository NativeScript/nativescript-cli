'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyRequest = exports.Request = exports.RequestMethod = undefined;
exports.formatKinveyAuthUrl = formatKinveyAuthUrl;
exports.formatKinveyBaasUrl = formatKinveyBaasUrl;

var _url = require('url');

var _client = require('../client');

var _headers = require('./headers');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @private
 */
var RequestMethod = exports.RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

/**
 * @private
 */

var Request = exports.Request = function Request(request) {
  _classCallCheck(this, Request);

  this.headers = new _headers.Headers(request.headers);
  this.method = request.method;
  this.url = request.url;
  this.body = request.body;
  this.timeout = request.timeout;
};

function getKinveyUrl(protocol, host, pathname, query) {
  var _getConfig = (0, _client.getConfig)(),
      appKey = _getConfig.appKey;

  return (0, _url.format)({
    protocol: protocol,
    host: host,
    pathname: pathname.replace(/appKey/gi, appKey),
    query: query
  });
}

function formatKinveyAuthUrl(pathname, query) {
  var _getConfig2 = (0, _client.getConfig)(),
      api = _getConfig2.api;

  return getKinveyUrl(api.auth.protocol, api.auth.host, pathname, query);
}

function formatKinveyBaasUrl(pathname, query) {
  var _getConfig3 = (0, _client.getConfig)(),
      api = _getConfig3.api;

  return getKinveyUrl(api.baas.protocol, api.baas.host, pathname, query);
}

var KinveyRequest = exports.KinveyRequest = function (_Request) {
  _inherits(KinveyRequest, _Request);

  function KinveyRequest(request) {
    _classCallCheck(this, KinveyRequest);

    var _this = _possibleConstructorReturn(this, (KinveyRequest.__proto__ || Object.getPrototypeOf(KinveyRequest)).call(this, request));

    _this.headers = new _headers.KinveyHeaders(request.headers);
    _this.headers.auth = request.auth;
    return _this;
  }

  return KinveyRequest;
}(Request);