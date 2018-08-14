'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;
exports.initialize = initialize;
exports.getConfig = getConfig;
exports.getAppVersion = getAppVersion;
exports.setAppVersion = setAppVersion;

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

var _url = require('url');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function uuidv4() {
  return '' + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var internalConfig = void 0;

function init(config) {
  var appKey = config.appKey,
      appSecret = config.appSecret,
      appVersion = config.appVersion,
      instanceId = config.instanceId,
      encryptionKey = config.encryptionKey,
      defaultTimeout = config.defaultTimeout;


  if (instanceId && !(0, _isString2.default)(instanceId)) {
    throw new Error('Instance ID must be a string.');
  }

  var apiHostname = instanceId ? 'https://' + instanceId + '-baas.kinvey.com' : 'https://baas.kinvey.com';
  var authHostname = instanceId ? 'https://' + instanceId + '-auth.kinvey.com' : 'https://auth.kinvey.com';

  if (!(0, _isString2.default)(appKey)) {
    throw new Error('An appKey is required and must be a string.');
  }

  if (!(0, _isString2.default)(appSecret)) {
    throw new Error('An appSecret is required and must be a string.');
  }

  if (appVersion && !(0, _isString2.default)(appVersion)) {
    throw new Error('An appVersion must be a string.');
  }

  if (encryptionKey && !(0, _isString2.default)(encryptionKey)) {
    throw new Error('An encryptionKey must be a string.');
  }

  if (defaultTimeout != null && (!(0, _isNumber2.default)(defaultTimeout) || defaultTimeout < 1)) {
    throw new Error('A defaultTimeout must be a number greater then 0.');
  }

  internalConfig = {
    appKey: appKey,
    appSecret: appSecret,
    appVersion: appVersion,
    api: {
      defaultTimeout: defaultTimeout || 60000,
      auth: {
        protocol: (0, _url.parse)(authHostname).protocol,
        host: (0, _url.parse)(authHostname).host,
        hostname: authHostname
      },
      baas: {
        protocol: (0, _url.parse)(apiHostname).protocol,
        host: (0, _url.parse)(apiHostname).host,
        hostname: apiHostname
      }
    },
    device: {
      id: uuidv4(),
      encryptionKey: encryptionKey
    }
  };

  return config;
}

/**
 * @deprecated Please use init().
 */
function initialize(config) {
  try {
    init(config);
    return Promise.resolve(null);
    // return Promise.resolve(User.getActiveUser(client));
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * @private
 */
function getConfig() {
  if (!internalConfig) {
    throw new Error('You have not initialized the Kinvey JavaScript SDK.');
  }

  return internalConfig;
}

/**
 * The version of your app. It will sent with Kinvey API requests
 * using the X-Kinvey-Api-Version header.
 *
 * @return {string} The version of your app.
 */
function getAppVersion() {
  var config = getConfig();
  return config.appVersion;
}

/**
 * Set the version of your app. It will sent with Kinvey API requests
 * using the X-Kinvey-Api-Version header.
 *
 * @param  {string} appVersion  App version.
 */
function setAppVersion(appVersion) {
  var config = getConfig();
  config.appVersion = appVersion;
}