'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.use = use;
exports.getActiveUser = getActiveUser;
exports.setActiveUser = setActiveUser;
exports.removeActiveUser = removeActiveUser;

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _client = require('../client');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var store = new Map();
function use(sessionStore) {
  if (sessionStore) {
    store = sessionStore;
  }
}

function getActiveUser() {
  var _getConfig = (0, _client.getConfig)(),
      appKey = _getConfig.appKey;

  return store.get(appKey);
}

function setActiveUser(user) {
  var _getConfig2 = (0, _client.getConfig)(),
      appKey = _getConfig2.appKey;

  if (!user) {
    throw new Error('Please provide a valid user to set as the active user.');
  }

  store.set(appKey, user);
  return user;
}

function removeActiveUser() {
  var _getConfig3 = (0, _client.getConfig)(),
      appKey = _getConfig3.appKey;

  if ((0, _isFunction2.default)(store.delete)) {
    store.delete(appKey);
  } else {
    store.remove(appKey);
  }

  return null;
}