"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;
exports.get = get;
exports.set = set;
exports.remove = remove;

require("core-js/modules/web.dom.iterable");

var _isFunction = _interopRequireDefault(require("lodash/isFunction"));

var _kinveyApp = require("kinvey-app");

const TAG = 'session';
let store = new Map();

function register(sessionStore) {
  if (sessionStore) {
    store = sessionStore;
  }
}

function get() {
  const _getConfig = (0, _kinveyApp.getConfig)(),
        appKey = _getConfig.appKey;

  return store.get(`${appKey}${TAG}`);
}

function set(session) {
  const _getConfig2 = (0, _kinveyApp.getConfig)(),
        appKey = _getConfig2.appKey;

  if (session) {
    store.set(`${appKey}${TAG}`, session);
  }

  return session;
}

function remove() {
  const _getConfig3 = (0, _kinveyApp.getConfig)(),
        appKey = _getConfig3.appKey;

  if ((0, _isFunction.default)(store.delete)) {
    store.delete(`${appKey}${TAG}`);
  } else {
    store.remove(`${appKey}${TAG}`);
  }

  return null;
}