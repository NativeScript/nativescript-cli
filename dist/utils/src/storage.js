'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getActiveUser = getActiveUser;
exports.setActiveUser = setActiveUser;
exports.getIdentitySession = getIdentitySession;
exports.setIdentitySession = setIdentitySession;

var _localStorage = require('local-storage');

var _localStorage2 = _interopRequireDefault(_localStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var userCollectionName = process && process.env && process.env.KINVEY_USER_COLLECTION_NAME || 'kinvey_user' || 'kinvey_user';

/**
 * @private
 */
function getActiveUser(client) {
  return _localStorage2.default.get('' + client.appKey + userCollectionName);
}

/**
 * @private
 */
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

/**
 * @private
 */
function getIdentitySession(client, identity) {
  return _localStorage2.default.get('' + client.appKey + identity);
}

/**
 * @private
 */
function setIdentitySession(client, identity, session) {
  if (session) {
    try {
      return _localStorage2.default.set('' + client.appKey + identity, session);
    } catch (error) {
      return false;
    }
  }

  return _localStorage2.default.remove('' + client.appKey + identity);
}