'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getKinveyAuthorizationHeader = getKinveyAuthorizationHeader;
exports.getKinveyAppAuthorizationHeader = getKinveyAppAuthorizationHeader;
exports.getKinveyClientAuthorizationHeader = getKinveyClientAuthorizationHeader;
exports.getKinveySessionAuthorizationHeader = getKinveySessionAuthorizationHeader;
exports.getKinveyUrl = getKinveyUrl;
exports.formatKinveyAuthUrl = formatKinveyAuthUrl;
exports.formatKinveyBaasUrl = formatKinveyBaasUrl;

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _url = require('url');

var _client = require('../client');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getKinveyAuthorizationHeader(info) {
  if (!info || !(0, _isString2.default)(info.scheme)) {
    throw new Error('Please provide valid authorization info. The authorization info must have a scheme that is a string.');
  }

  var credentials = info.credentials;


  if ((0, _isString2.default)(info.username) && (0, _isString2.default)(info.password)) {
    credentials = Buffer.from(info.username + ':' + info.password).toString('base64');
  }

  if (!credentials) {
    throw new Error('Please provide valid authorization info. The authorization info must contain either a username and password or credentials.');
  }

  return {
    name: 'Authorization',
    value: info.scheme + ' ' + credentials
  };
}

function getKinveyAppAuthorizationHeader() {
  var _getConfig = (0, _client.getConfig)(),
      appKey = _getConfig.appKey,
      appSecret = _getConfig.appSecret;

  return getKinveyAuthorizationHeader({
    scheme: 'Basic',
    username: appKey,
    password: appSecret
  });
}

function getKinveyClientAuthorizationHeader(clientId) {
  var _getConfig2 = (0, _client.getConfig)(),
      appSecret = _getConfig2.appSecret;

  if (!(0, _isString2.default)(clientId)) {
    throw new Error('Please provide a valid clientId. The clientId must be a string.');
  }

  return getKinveyAuthorizationHeader({
    scheme: 'Basic',
    username: clientId,
    password: appSecret
  });
}

function getKinveySessionAuthorizationHeader(authtoken) {
  if (!authtoken || !(0, _isString2.default)(authtoken)) {
    throw new Error('Please provide a valid auth token. The auth token must be a string.');
  }

  return getKinveyAuthorizationHeader({
    scheme: 'Kinvey',
    credentials: authtoken
  });
}

function getKinveyUrl(protocol, host, pathname, query) {
  var _getConfig3 = (0, _client.getConfig)(),
      appKey = _getConfig3.appKey;

  return (0, _url.format)({
    protocol: protocol,
    host: host,
    pathname: pathname.replace(/appKey/gi, appKey),
    query: query
  });
}

function formatKinveyAuthUrl(pathname, query) {
  var _getConfig4 = (0, _client.getConfig)(),
      api = _getConfig4.api;

  return getKinveyUrl(api.auth.protocol, api.auth.host, pathname, query);
}

function formatKinveyBaasUrl(pathname, query) {
  var _getConfig5 = (0, _client.getConfig)(),
      api = _getConfig5.api;

  return getKinveyUrl(api.baas.protocol, api.baas.host, pathname, query);
}