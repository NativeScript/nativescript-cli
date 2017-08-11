import url from 'url';
import Client from '../../../client';
import { getLiveService } from './live-service';
import { KinveyRequest, RequestMethod, AuthType } from '../../../request';
import { StreamACL } from './stream-acl';

/**
 * @typedef MessageReceiver
 * @property {Function} status
 * @property {Function} message
 * @property {Function} presence
 */

/**
 * A Stream, created in the backend
 * @class Stream
 */
export class Stream {
  /** @type {string} */
  name;
  client = Client.sharedInstance();
  liveService = getLiveService(this.client);
  subscribeChannels = {};
  publishChannels = {};

  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }

  getSubstreams() {
    return this._makeStreamRequest('_substreams', RequestMethod.GET)
      .then(response => response.data);
  }

  /**
   * @param {string} substreamOwnerId
   * @param {StreamACL} acl
   * @returns {Promise} Response promise
   */
  setStreamACL(substreamOwnerId, acl) {
    const requestBody = (acl instanceof StreamACL) ? acl.toPlainObject() : acl;

    return this._makeStreamRequest(substreamOwnerId, RequestMethod.PUT, requestBody)
      .then(response => response.data);
  }

  // Feed comm

  /**
   * @param {string} userId
   * @param {MessageReceiver} receiver
   */
  follow(userId, receiver) {
    return this._subscribe(userId, receiver);
  }

  /**
   * @param {string} userId
   */
  unfollow(userId) {
    return this._unsubscribe(userId);
  }

  /**
   * @param {Object} message
   */
  post(message) {
    const userId = this.client.activeUser._id;
    return this._publish(userId, message);
  }

  // Directed comm

  /**
   * In directed communication, listens for messages sent to the active user
   * @param {MessageReceiver} receiver
   */
  listen(receiver) {
    const userId = this.client.activeUser._id;
    return this._subscribe(userId, receiver);
  }

  stopListening() {
    const userId = this.client.activeUser._id;
    return this._unsubscribe(userId);
  }

  /**
   * In directed communication, sends a message to the specified user
   * @param {string} userId
   * @param {Object} message
   */
  send(userId, message) {
    return this._publish(userId, message);
  }

  /**
   * @private
   * @param {string} substreamOwnerId
   */
  _unsubscribeFromSubstream(substreamOwnerId) {
    const path = `${substreamOwnerId}/unsubscribe`;

    return this._makeStreamRequest(path, RequestMethod.POST, { deviceId: this.client.deviceId })
      .then((response) => {
        delete this.subscribeChannels[substreamOwnerId];
        return response.data;
      });
  }

  /**
   * @private
   * @param {string} userId
   * @param {MessageReceiver} receiver
   */
  _subscribe(userId, receiver) {
    return this._requestSubscribeAccess(userId)
      .then((resp) => {
        const channelName = this.subscribeChannels[userId] || this._buildChannelName(userId);
        return this.liveService.subscribeToChannel(channelName, receiver);
      })
      .then(() => undefined);
  }

  /**
   * @private
   * @param {string} userId
   */
  _unsubscribe(userId) {
    // TODO: redo
    const channelName = this.subscribeChannels[userId] || this._buildChannelName(userId);
    return this.liveService.unsubscribeFromChannel(channelName);
  }

  /**
   * @private
   * @param {string} userId
   * @param {Object} message
   */
  _publish(userId, message) {
    // return this._requestPublishAccess(userId)
    //   .then((resp) => { // TODO: use resp.publishchannel or whatever
    //     const channelName = this.publishChannels[userId] || this._buildChannelName(userId);
    //     return this.liveService.publishToChannel(channelName, message);
    //   });

    const channelName = this.publishChannels[userId] || this._buildChannelName(userId);

    return this.liveService.publishToChannel(channelName, message)
      .catch((err) => {
        if (err.statusCode === 401 || err.statusCode === 403) { // TODO: check which is when and use constants
          return this._requestPublishAccess(userId)
            .then(() => this.liveService.publishToChannel(channelName, message));
        }
        return Promise.reject(err);
      });
  }

  _buildChannelName(userId) {
    return `${this.client.appKey}.s-${this.name}.u-${userId}`;
  }

  /**
   * @private
   * @param {string} substreamOwnerId
   */
  _requestPublishAccess(substreamOwnerId) {
    return this._makeStreamRequest(`${substreamOwnerId}/publish`, RequestMethod.POST)
      .then((resp) => {
        this.publishChannels[substreamOwnerId] = resp.data.substreamChannelName;
        return resp.data;
      });
  }

  /**
   * @private
   * @param {string} substreamOwnerId
   */
  _requestSubscribeAccess(substreamOwnerId) {
    const requestBody = { deviceId: this.client.deviceId };

    return this._makeStreamRequest(`${substreamOwnerId}/subscribe`, RequestMethod.POST, requestBody)
      .then((response) => {
        this.subscribeChannels[substreamOwnerId] = response.data.substreamChannelName;
        return response.data;
      });
  }

  /**
   * @private
   * @param {string} path The path after the stream/kid part
   * @param {RequestMethod} method The request method to be used
   * @param {Object} [body] The body of the request, if applicable
   * @returns {Promise}
   */
  _makeStreamRequest(path, method, body) {
    // TODO: put building of the url inside the execute/someother call,
    // add default value, or methods for each auth type
    return KinveyRequest.execute({
      method: method,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/stream/${this.client.appKey}/${this.name}/${path}`
      }),
      body: body
    });
  }
}
