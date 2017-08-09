import url from 'url';
import PubNub from 'pubnub';

import Client from '../../../client';
import { KinveyRequest, RequestMethod, AuthType } from '../../../request';
import { StreamACL } from './stream-acl';
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
  /** @type {string} @private @constant */
  streamEndpoint;

  /**
   * @constructor
   * @param {Client} client
   */
  constructor(client) {
    this.client = client || Client.sharedInstance();
    this.streamEndpoint = `/stream/${this.client.appKey}`;
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
   * @param {string} streamOwnerId
   * @param {string} streamName
   * @param {StreamACL} acl
   * @returns {Promise} Response promise
   */
  setSubstreamACL(streamOwnerId, streamName, acl) {
    const request = new KinveyRequest({
      method: RequestMethod.PUT,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `${this.streamEndpoint}/${streamName}/${streamOwnerId}`
      }),
      body: (acl instanceof StreamACL) ? acl.toPlainObject() : acl
    });

    return request.execute()
      .then(response => response.data);
  }

  /**
   * @param {string} streamName
   * @param {string} substreamOwnerId
   */
  requestSubstreamPublishAccess(streamName, substreamOwnerId) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `${this.streamEndpoint}/${streamName}/${substreamOwnerId}/publish`
      })
    });

    return request.execute()
      .then(response => response.data);
  }

  /**
   * @param {string} streamName
   * @param {string} substreamOwnerId
   */
  requestSubstreamSubscribeAccess(streamName, substreamOwnerId) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `${this.streamEndpoint}/${streamName}/${substreamOwnerId}/subscribe`
      }),
      body: { deviceId: this.client.deviceId }
    });

    return request.execute()
      .then(response => response.data);
  }

  /**
   * @param {string} streamName
   * @param {string} substreamOwnerId
   */
  unsubscribeFromSubstream(streamName, substreamOwnerId) {
    const path = `${streamName}/${substreamOwnerId}/unsubscribe`;
    const request = this._getStreamRequestObject(path, RequestMethod.POST, { deviceId: this.client.deviceId });

    return request.execute()
      .then(response => response.data);
  }

  /**
   * @param {string} streamName
   */
  getStreamSubstreams(streamName) {
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `${this.streamEndpoint}/${streamName}/_substreams`
      })
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

  /**
   * @private
   * @param {string} path The path after the stream/kid part
   * @param {RequestMethod} method The request method to be used
   * @param {Object} [body] The body of the request, if applicable
   * @returns {Promise}
   */
  _getStreamRequestObject(path, method, body) {
    const request = new KinveyRequest({
      method: method,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `${this.streamEndpoint}/${path}`
      }),
      body: body
    });

    return request;
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
