"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = init;

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isNumber = _interopRequireDefault(require("lodash/isNumber"));

var _url = require("url");

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _config = require("./config");

var DEFAULT_TIMEOUT = 60000;

function init() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var appKey = config.appKey,
      appSecret = config.appSecret,
      masterSecret = config.masterSecret,
      appVersion = config.appVersion,
      instanceId = config.instanceId,
      encryptionKey = config.encryptionKey,
      storage = config.storage;
  var defaultTimeout = (0, _isNumber.default)(config.defaultTimeout) && config.defaultTimeout >= 0 ? config.defaultTimeout : DEFAULT_TIMEOUT;
  var apiHostname = 'https://baas.kinvey.com';
  var authHostname = 'https://auth.kinvey.com';

  if (instanceId) {
    if (!(0, _isString.default)(instanceId)) {
      throw new _kinvey.default('Instance ID must be a string.');
    }

    apiHostname = "https://".concat(instanceId, "-baas.kinvey.com");
    authHostname = "https://".concat(instanceId, "-auth.kinvey.com");
  } else {
    if ((0, _isString.default)(config.apiHostname)) {
      apiHostname = /^https?:\/\//i.test(config.apiHostname) ? config.apiHostname : "https://".concat(config.apiHostname);
    }

    if ((0, _isString.default)(config.micHostname)) {
      authHostname = /^https?:\/\//i.test(config.micHostname) ? config.micHostname : "https://".concat(config.micHostname);
    }
  }

  if (!(0, _isString.default)(appKey)) {
    throw new _kinvey.default('An appKey is required and must be a string.');
  }

  if (!(0, _isString.default)(appSecret) && !(0, _isString.default)(masterSecret)) {
    throw new _kinvey.default('An appSecret is required and must be a string.');
  }

  if (appVersion && !(0, _isString.default)(appVersion)) {
    throw new _kinvey.default('An appVersion must be a string.');
  }

  if (encryptionKey && !(0, _isString.default)(encryptionKey)) {
    throw new _kinvey.default('An encryptionKey must be a string.');
  } // TODO: Add check in future
  // if (defaultTimeout != null && (!isNumber(defaultTimeout) || defaultTimeout < 1)) {
  //   throw new KineyError('A defaultTimeout must be a number greater then 0.');
  // }
  // Create the internal config


  var internalConfig = {
    appKey: appKey,
    appSecret: appSecret,
    masterSecret: masterSecret,
    encryptionKey: encryptionKey,
    appVersion: appVersion,
    _appVersion: appVersion,
    defaultTimeout: defaultTimeout,
    _defaultTimeout: defaultTimeout,
    storage: storage,
    apiProtocol: (0, _url.parse)(apiHostname).protocol,
    apiHost: (0, _url.parse)(apiHostname).host,
    apiHostname: apiHostname,
    authProtocol: (0, _url.parse)(authHostname).protocol,
    authHost: (0, _url.parse)(authHostname).host,
    authHostname: authHostname,
    micProtocol: (0, _url.parse)(authHostname).protocol,
    micHost: (0, _url.parse)(authHostname).host,
    micHostname: authHostname
  }; // Set the internal config

  (0, _config.set)(internalConfig); // Return the internal config

  return internalConfig;
}