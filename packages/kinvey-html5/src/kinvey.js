const url = require('url');
const Promise = require('es6-promise');
const { client, getAppVersion, setAppVersion, ping } = require('kinvey');
const { isDefined } = require('kinvey-utils/object');
const { KinveyError } = require('kinvey-errors');
const { CacheRequest, RequestMethod } = require('kinvey-request');
const { User } = require('kinvey-user');
const { Client } = require('./client');

const USERS_NAMESPACE = 'user';
const ACTIVE_USER_COLLECTION_NAME = 'kinvey_active_user';

exports.client = client;
exports.getAppVersion = getAppVersion;
exports.setAppVersion = setAppVersion;
exports.ping = ping;

function init(config) {
  if (!isDefined(config.appKey)) {
    throw new KinveyError('No App Key was provided.'
      + ' Unable to create a new Client without an App Key.');
  }

  if (!isDefined(config.appSecret) && !isDefined(config.masterSecret)) {
    throw new KinveyError('No App Secret or Master Secret was provided.'
      + ' Unable to create a new Client without an App Secret.');
  }

  return Client.init(config);
}
exports.init = init;

function initialize(config) {
  try {
    const client = init(config);
    const activeUser = User.getActiveUser(client);

    if (isDefined(activeUser)) {
      return Promise.resolve(activeUser);
    }

    const request = new CacheRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: `/${USERS_NAMESPACE}/${client.appKey}/${ACTIVE_USER_COLLECTION_NAME}`
      })
    });
    return request.execute()
      .then(response => response.data)
      .then((activeUsers) => {
        if (activeUsers.length > 0) {
          return activeUsers[0];
        }

        return null;
      })
      .then((activeUser) => {
        if (isDefined(activeUser)) {
          if (isDefined(activeUser.data)) {
            return client.setActiveUser(activeUser.data);
          }

          return client.setActiveUser(activeUser);
        }

        return activeUser;
      })
      .then(() => User.getActiveUser(client));
  } catch (e) {
    return Promise.reject(e);
  }
}
exports.initialize = initialize;
