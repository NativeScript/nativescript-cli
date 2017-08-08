/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "User|StreamACL" }] */
import url from 'url';
import PubNub from 'pubnub';

import { KinveyError } from '../../../errors';
import Client from '../../../client';
import { KinveyRequest, RequestMethod, AuthType } from '../../../request';

// TODO: imported for type definitions - is there a better way?
import { User } from '../../../entity';
import { StreamACL } from './stream-acl';

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
   * @param {User} user
   * @returns {Promise}
   */
  registerUser(user) {
    if (!user.isActive()) {
      const msg = 'This user must be the active user in order to register for real time.';
      return Promise.reject(new KinveyError(msg));
    }

    return this._makeRegisterRequest(user._id)
      .then((pubnubConfig) => {
        this.registeredUser = user;
        this.userChannelGroup = pubnubConfig.userChannelGroup;
        this.pubnubClient = new PubNub({
          publishKey: pubnubConfig.publishKey,
          subscribeKey: pubnubConfig.subscribeKey,
          authKey: pubnubConfig.authKey
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
   * @param  {string} streamOwnerId
   * @param  {string} streamName
   * @param  {StreamACL} acl
   * @returns {Promise} Response promise
   */
  setSubstreamACL(streamOwnerId, streamName, acl) {
    const request = new KinveyRequest({
      method: RequestMethod.PUT,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/streams/${this.client.appKey}/${streamName}/${streamOwnerId}`
      }),
      body: acl.toPlainObject()
    });

    return request.execute()
      .then(response => response.data);
  }

  /**
   * @private
   * @param {string} userId The user id
   * @returns {Promise<{publishKey: string, subscribeKey: string, authKey: string, userChannelGroup: string}>}
   */
  _makeRegisterRequest(userId) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/user/${this.client.appKey}/${userId}/register-realtime`
      }),
      body: { deviceId: this.client.deviceId }
    });

    return request.execute()
      .then(response => response.data);
  }

  /**
   * @private
   * @param {string} userId The user id
   * @returns {Promise}
   */
  _makeUnregisterRequst(userId) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/user/${this.client.appKey}/${userId}/unregister-realtime`
      }),
      body: { deviceId: this.client.deviceId }
    });

    return request.execute()
      .then(response => response.data);
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
