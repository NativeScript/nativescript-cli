import Client from '../../../client';
import { getLiveService } from './live-service';
import { KinveyRequest, RequestMethod, StatusCode } from '../../../request';
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
    return this._makeStreamRequest('_substreams', RequestMethod.GET);
  }

  /**
   * Thist method sets (overwrites) the ACL for the given user's message stream
   * @param {string} userId The ID of the user whose stream ACL is being set
   * @param {StreamACL} acl The ACL object to be set
   * @returns {Promise}
   */
  setStreamACL(userId, acl) {
    const requestBody = (acl instanceof StreamACL) ? acl.toPlainObject() : acl;
    return this._makeStreamRequest(userId, RequestMethod.PUT, requestBody);
  }

  // Feed comm

  /**
   * Subscribes the active user to the specified user's channel
   * @param {string} userId
   * @param {MessageReceiver} receiver
   */
  follow(userId, receiver) {
    return this._subscribe(userId, receiver);
  }

  /**
   * Unsubscribes the active user from the specified user's channel
   * @param {string} userId
   * @returns {Promise}
   */
  unfollow(userId) {
    return this._unsubscribe(userId);
  }

  /**
   * Posts a message to the active user's channel
   * @param {Object} message
   * @returns {Promise}
   */
  post(message) {
    const userId = this.client.activeUser._id;
    return this._publish(userId, message);
  }

  // Directed comm

  /**
   * Listens for messages sent to the active user
   * @param {MessageReceiver} receiver
   */
  listen(receiver) {
    const userId = this.client.activeUser._id;
    return this._subscribe(userId, receiver);
  }

  /**
   * Stops listening for messages sent to the active user
   */
  stopListening() {
    const userId = this.client.activeUser._id;
    return this._unsubscribe(userId);
  }

  /**
   * Sends a message to the specified user
   * @param {string} userId
   * @param {Object} message
   */
  send(userId, message) {
    return this._publish(userId, message);
  }

  /**
   * @private
   * @param {string} substreamOwnerId
   * @returns {Promise}
   */
  _unsubscribeFromSubstream(substreamOwnerId) {
    const path = `${substreamOwnerId}/unsubscribe`;

    return this._makeStreamRequest(path, RequestMethod.POST, { deviceId: this.client.deviceId })
      .then((response) => {
        delete this.subscribeChannels[substreamOwnerId];
        return response;
      });
  }

  /**
   * @private
   * @param {string} userId
   * @param {MessageReceiver} receiver
   * @returns {Promise}
   */
  _subscribe(userId, receiver) {
    return this._requestSubscribeAccess(userId)
      .then(() => {
        const channelName = this.subscribeChannels[userId] || this._buildChannelName(userId);
        return this.liveService.subscribeToChannel(channelName, receiver);
      });
  }

  /**
   * @private
   * @param {string} userId
   * @returns {Promise<void>}
   */
  _unsubscribe(userId) {
    return this._unsubscribeFromSubstream(userId)
      .then(() => {
        const channelName = this.subscribeChannels[userId] || this._buildChannelName(userId);
        this.liveService.unsubscribeFromChannel(channelName);
      });
  }

  /**
   * @private
   * @param {string} userId
   * @param {Object} message
   * @returns {Promise}
   */
  _publish(userId, message) {
    if (this.publishChannels[userId]) {
      return this._retriablePublish(userId, message);
    }
    return this._publishWithAccessRequest(userId, message);
  }

  /**
   * @private
   * @param {string} userId
   * @param {Object} message
   * @returns {Promise}
   */
  _publishWithAccessRequest(userId, message) {
    return this._requestPublishAccess(userId)
      .then(() => {
        const channelName = this.publishChannels[userId] || this._buildChannelName(userId);
        return this.liveService.publishToChannel(channelName, message);
      });
  }

  /**
   * @private
   * @param {string} userId
   * @param {Object} message
   * @returns {Promise}
   */
  _retriablePublish(userId, message) {
    const channelName = this.publishChannels[userId] || this._buildChannelName(userId);
    return this.liveService.publishToChannel(channelName, message)
      .catch((err) => {
        let promise = Promise.reject(err);
        if (err.statusCode === StatusCode.Forbidden) {
          promise = this._publishWithAccessRequest(userId, message);
        }
        return promise;
      });
  }

  /**
   * @private
   * @param {string} userId
   * @returns {string} The name of the channel for that user
   */
  _buildChannelName(userId) {
    return `${this.client.appKey}.s-${this.name}.u-${userId}`;
  }

  /**
   * @private
   * @param {string} substreamOwnerId
   * @returns {Promise}
   */
  _requestPublishAccess(substreamOwnerId) {
    return this._makeStreamRequest(`${substreamOwnerId}/publish`, RequestMethod.POST)
      .then((resp) => {
        if (resp.substreamChannelName) {
          this.publishChannels[substreamOwnerId] = resp.substreamChannelName;
        }
        return resp;
      });
  }

  /**
   * @private
   * @param {string} userId
   * @returns {Promise}
   */
  _requestSubscribeAccess(userId) {
    const requestBody = { deviceId: this.client.deviceId };

    return this._makeStreamRequest(`${userId}/subscribe`, RequestMethod.POST, requestBody)
      .then((response) => {
        this.subscribeChannels[userId] = response.substreamChannelName;
        return response;
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
    return KinveyRequest.executeShort({
      method: method,
      pathname: `/stream/${this.client.appKey}/${this.name}/${path}`,
      body: body
    }, this.client, true);
  }
}
