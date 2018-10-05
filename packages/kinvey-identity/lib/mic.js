"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.login = login;
exports.AuthorizationGrant = exports.IDENTITY = void 0;

var _isString = _interopRequireDefault(require("lodash/isString"));

var _urlJoin = _interopRequireDefault(require("url-join"));

var _url = require("url");

var _jsBase = require("js-base64");

var _kinveyApp = require("kinvey-app");

var _kinveyHttp = require("kinvey-http");

var _kinveyPopup = require("kinvey-popup");

// Export identity
const IDENTITY = 'kinveyAuth';
/**
 * Enum for Mobile Identity Connect authorization grants.
 * @property  {string}    AuthorizationCodeLoginPage   AuthorizationCodeLoginPage grant
 * @property  {string}    AuthorizationCodeAPI         AuthorizationCodeAPI grant
 */

exports.IDENTITY = IDENTITY;
const AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
exports.AuthorizationGrant = AuthorizationGrant;
Object.freeze(AuthorizationGrant);

async function getTempLoginUrl(clientId, redirectUri, version) {
  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: () => {
        const _getConfig = (0, _kinveyApp.getConfig)(),
              appSecret = _getConfig.appSecret;

        const credentials = _jsBase.Base64.encode(`${clientId}:${appSecret}`);

        return `Basic ${credentials}`;
      }
    },
    url: (0, _kinveyHttp.formatKinveyAuthUrl)((0, _urlJoin.default)(`v${version}`, '/oauth/auth')),
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code'
    }
  });
  const response = await request.execute();
  return response.data;
}

function loginWithPopup(clientId, redirectUri, version) {
  return new Promise(async (resolve, reject) => {
    const query = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid'
    };
    const url = (0, _kinveyHttp.formatKinveyAuthUrl)((0, _urlJoin.default)(`v${version}`, '/oauth/auth'), query);
    const popup = (0, _kinveyPopup.open)(url);
    let redirected = false;
    popup.onLoaded(event => {
      try {
        if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
          const parsedUrl = (0, _url.parse)(event.url, true); // eslint-disable-next-line camelcase

          const _ref = parsedUrl.query || {},
                code = _ref.code,
                error = _ref.error,
                error_description = _ref.error_description;

          redirected = true;
          popup.removeAllListeners();
          popup.close();

          if (code) {
            resolve(code);
          } else if (error) {
            reject(new Error(error, error_description));
          } else {
            reject(new Error('No code or error was provided.'));
          }
        }
      } catch (error) {// Just catch the error
      }
    });
    popup.onClosed(() => {
      if (!redirected) {
        popup.removeAllListeners();
        reject(new Error('Login has been cancelled.'));
      }
    });
  });
}

async function loginWithUrl(url, username, password, clientId, redirectUri) {
  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: () => {
        const _getConfig2 = (0, _kinveyApp.getConfig)(),
              appSecret = _getConfig2.appSecret;

        const credentials = _jsBase.Base64.encode(`${clientId}:${appSecret}`);

        return `Basic ${credentials}`;
      }
    },
    url,
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      username,
      password,
      scope: 'openid'
    }
  });
  const response = await request.execute();
  const location = response.headers.get('location');
  const parsedLocation = (0, _url.parse)(location, true) || {};
  const query = parsedLocation.query || {};
  return query.code;
}

async function getTokenWithCode(code, clientId, redirectUri) {
  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: () => {
        const _getConfig3 = (0, _kinveyApp.getConfig)(),
              appSecret = _getConfig3.appSecret;

        const credentials = _jsBase.Base64.encode(`${clientId}:${appSecret}`);

        return `Basic ${credentials}`;
      }
    },
    url: (0, _kinveyHttp.formatKinveyAuthUrl)('/oauth/token'),
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code
    }
  });
  const response = await request.execute();
  return response.data;
}

async function login(redirectUri, authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage, options = {}) {
  const _getConfig4 = (0, _kinveyApp.getConfig)(),
        appKey = _getConfig4.appKey;

  const micId = options.micId,
        _options$version = options.version,
        version = _options$version === void 0 ? 3 : _options$version,
        username = options.username,
        password = options.password;
  let clientId = appKey;
  let code;

  if (!(0, _isString.default)(redirectUri)) {
    return Promise.reject(new Error('A redirectUri is required and must be a string.'));
  }

  if ((0, _isString.default)(micId)) {
    clientId = `${clientId}.${micId}`;
  }

  if (authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI) {
    const url = await getTempLoginUrl(clientId, redirectUri, version);
    code = await loginWithUrl(url, username, password, clientId, redirectUri);
  } else {
    code = await loginWithPopup(clientId, redirectUri, version);
  }

  const token = await getTokenWithCode(code, clientId, redirectUri);
  return token;
}