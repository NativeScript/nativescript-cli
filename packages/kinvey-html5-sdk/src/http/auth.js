"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.app = app;
exports.master = master;
exports.session = session;
exports.basic = basic;
exports.defaultAuth = defaultAuth;
exports.all = all;
exports.Auth = void 0;

var _jsBase = require("js-base64");

var _activeUser = _interopRequireDefault(require("../errors/activeUser"));

function app(appKey, appSecret) {
  var credentials = _jsBase.Base64.encode("".concat(appKey, ":").concat(appSecret));

  return "Basic ".concat(credentials);
}

function master(appKey, masterSecret) {
  var credentials = _jsBase.Base64.encode("".concat(appKey, ":").concat(masterSecret));

  return "Basic ".concat(credentials);
}

function session(session) {
  if (!session || !session._kmd || !session._kmd.authtoken) {
    throw new _activeUser.default('There is no active user to authorize the request. Please login and retry the request.');
  }

  return "Kinvey ".concat(session._kmd.authtoken);
}

function basic(appKey, appSecret, masterSecret) {
  try {
    return app(appKey, appSecret);
  } catch (error) {
    return master(appKey, masterSecret);
  }
}

function defaultAuth(_session, appKey, masterSecret) {
  try {
    return session(_session);
  } catch (error) {
    return master(appKey, masterSecret);
  }
}

function all(_session, appKey, appSecret, masterSecret) {
  try {
    return session(_session);
  } catch (error) {
    return basic(appKey, appSecret, masterSecret);
  }
}

var Auth = {
  All: 'All',
  App: 'App',
  Basic: 'Basic',
  Default: 'Default',
  Master: 'Master',
  Session: 'Session'
};
exports.Auth = Auth;