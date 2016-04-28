'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getActiveUser = getActiveUser;
exports.setActiveUser = setActiveUser;
exports.getActiveSocialIdentity = getActiveSocialIdentity;
exports.setActiveSocialIdentity = setActiveSocialIdentity;
exports.getSyncKey = getSyncKey;
exports.setSyncKey = setSyncKey;

var _localStorage = require('local-storage');

var _localStorage2 = _interopRequireDefault(_localStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var userCollectionName = 'kinvey_user' || 'kinvey_user';
var socialIdentityCollectionName = 'kinvey_socialIdentity' || 'kinvey_socialIdentity';
var syncKeyCollectionName = 'kinvey_syncKey' || 'kinvey_syncKey';

// Get the active user
function getActiveUser(client) {
  return _localStorage2.default.get('' + client.appKey + userCollectionName);
}

// Set the active user
function setActiveUser(client, data) {
  if (data) {
    try {
      return _localStorage2.default.set('' + client.appKey + userCollectionName, data);
    } catch (error) {
      return false;
    }
  }

  return _localStorage2.default.remove('' + client.appKey + userCollectionName);
}

// Get the active social identity
function getActiveSocialIdentity(client) {
  return _localStorage2.default.get('' + client.appKey + socialIdentityCollectionName);
}

// Set the active social identity
function setActiveSocialIdentity(client, data) {
  if (data) {
    try {
      return _localStorage2.default.set('' + client.appKey + socialIdentityCollectionName, data);
    } catch (error) {
      return false;
    }
  }

  return _localStorage2.default.remove('' + client.appKey + socialIdentityCollectionName);
}

// Get the sync key
function getSyncKey(client) {
  return _localStorage2.default.get('' + client.appKey + syncKeyCollectionName);
}

// Set the sync key
function setSyncKey(client, key) {
  if (key) {
    try {
      return _localStorage2.default.set('' + client.appKey + syncKeyCollectionName, key);
    } catch (error) {
      return false;
    }
  }

  return _localStorage2.default.remove('' + client.appKey + syncKeyCollectionName);
}