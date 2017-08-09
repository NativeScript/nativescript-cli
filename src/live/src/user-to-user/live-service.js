import url from 'url';
import PubNub from 'pubnub';

import Client from '../../../client';
import { KinveyRequest, RequestMethod, AuthType } from '../../../request';
import { User } from '../../../entity';

class LiveService {

  /** @type {Client} */
  client;
  /** @type {User} */
  registeredUser;
  /** @type {PubNub} */
  pubnubClient;
  /** @type {string} */
  userChannelGroup;

  /**
   * @constructor
   * @param {Client} client
   */
  constructor(client) {
    this.client = client || Client.sharedInstance();
  }

  /**
   * Subscribes the active user for live service
   * @returns {Promise}
   */
  registerUser() {
    const activeUser = User.getActiveUser();
    return this._makeRegisterRequest(activeUser._id)
      .then((pubnubConfig) => {
        this.registeredUser = this.client.activeUser;
        this.userChannelGroup = pubnubConfig.userChannelGroup;
        this.pubnubClient = new PubNub({
          publishKey: pubnubConfig.publishKey,
          subscribeKey: pubnubConfig.subscribeKey,
          // authKey: pubnubConfig.authKey // appears to be missing
        });
      });
  }

  /**
   * @param {string} userId The user id
   * @returns {Promise}
   */
  unregisterUser(userId) {
    return this._makeUnregisterRequst(userId);
  }

  /**
   * @private
   * @param {string} userId The user id
   * @returns {Promise<{publishKey: string, subscribeKey: string, authKey: string, userChannelGroup: string}>}
   */
  _makeRegisterRequest(userId) {
    return this._makeUserManagementRequest(`${userId}/register-realtime`)
      .then(response => response.data);
  }

  /**
   * @private
   * @param {string} userId The user id
   * @returns {Promise}
   */
  _makeUnregisterRequst(userId) {
    return this._makeUserManagementRequest(`${userId}/unregister-realtime`)
      .then(response => response.data);
  }

  _makeUserManagementRequest(path) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/user/${this.client.appKey}/${path}`
      }),
      body: { deviceId: this.client.deviceId }
    });

    return request.execute();
  }
}

let liveServiceInstance;

// TODO: passing client here seems odd - think of a better way
/**
 * Gets a singleton LiveService class instance
 * @param {Client} client
 * @returns {LiveService}
 */
export function getLiveService(client) {
  if (!liveServiceInstance) {
    liveServiceInstance = new LiveService(client);
  }
  return liveServiceInstance;
}
