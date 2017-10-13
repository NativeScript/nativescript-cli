import PubNub from 'pubnub';
import isFunction from 'lodash/isFunction';
import extend from 'lodash/extend';

import { Client } from '../client';
import { KinveyRequest, RequestMethod, Response } from '../request';
import { KinveyError, ActiveUserError } from '../errors';
import { isNonemptyString } from '../utils';
import { PubNubListener } from './pubnub-listener';

/**
 * @typedef LiveServiceReceiver
 * @property {Function} onMessage
 * @property {Function} onError
 * @property {Function} onStatus
 */

/**
 * @param {Object} obj
 * @returns {Boolean}
 */
function isValidReceiver(obj) {
  if (!obj) {
    return false;
  }
  const { onMessage, onError, onStatus } = obj;
  return isFunction(onMessage) || isFunction(onError) || isFunction(onStatus);
}

function isValidChannelName(str) {
  return isNonemptyString(str);
}

class LiveService {
  /**
   * @param {Client} client
   */
  constructor(client) {
    this._client = client || Client.sharedInstance();
    this._pubnubClient = undefined;
    this._pubnubListener = undefined;
    this._userChannelGroup = undefined;
    this._pubnubConfig = undefined;
    this._registeredUser = undefined;
  }

  get _pubnubClient() {
    if (!this.__pubnubClient) {
      this._throwNotInitializedError();
    }
    return this.__pubnubClient;
  }

  set _pubnubClient(value) {
    this.__pubnubClient = value;
  }

  set _pubnubListener(value) {
    this.__pubnubListener = value;
  }

  get _pubnubListener() {
    if (!this.__pubnubListener) {
      this._throwNotInitializedError();
    }
    return this.__pubnubListener;
  }

  /**
   * Registers user for live service and initializes LiveService instance
   * @param {User} user
   * @returns {Promise}
   */
  fullInitialization(user) {
    return this.registerUser(user)
      .then((pubnubConfig) => {
        // const copy = extend({}, pubnubConfig);
        const pubnubClient = new PubNub(pubnubConfig);
        const listener = new PubNubListener();
        this.initialize(pubnubClient, listener);
        // return copy;
      });
  }

  /**
   * Unregisters user from live service and uninitializes LiveService instance
   * @param {User} user
   * @returns {Promise}
   */
  fullUninitialization() {
    return this.unregisterUser()
      .then((resp) => {
        this.uninitialize();
        return resp;
      });
  }

  /**
   * Checks whether live service is ready to subscribe or publish messages
   * @returns {boolean}
   */
  isInitialized() {
    return !!this.__pubnubClient && !!this.__pubnubListener && !!this._registeredUser;
  }

  /**
   * Registers the active user for live service
   * @param {User} user
   * @returns {Promise}
   */
  registerUser(user) {
    if (!user || !user.isActive()) {
      return Promise.reject(new ActiveUserError('Missing or invalid active user'));
    }

    if (this.isInitialized()) {
      return Promise.reject(new KinveyError('Live service already initialized'));
    }

    return this._makeRegisterRequest(user._id)
      .then((regResponse) => {
        this._registeredUser = user;
        this._userChannelGroup = regResponse.userChannelGroup;
        const config = extend({
          ssl: true,
          authKey: this._registeredUser._kmd.authtoken
        }, regResponse);
        return config;
      });
  }

  /**
   * @param {PubNub} pubnubClient
   * @param {PubNubListener} pubnubListener
   */
  initialize(pubnubClient, pubnubListener) {
    if (this.isInitialized()) {
      throw new KinveyError('Live service already initialized');
    }

    this._pubnubListener = pubnubListener;
    this._pubnubClient = pubnubClient;
    this._pubnubClient.addListener(this._pubnubListener);
    this._subscribeToUserChannelGroup();
  }

  /**
   * Unsubscribes from all events in PubNub client and in listener
   */
  uninitialize() {
    this._unsubscribeFromAll();
    this._pubnubClient = null;
    this._pubnubListener = null;
  }

  /**
   * Attaches a handler for connection status updates
   * @param {Function} func
   */
  onConnectionStatusUpdates(func) {
    this._pubnubListener.on(PubNubListener.unclassifiedEvents, func);
    this._pubnubListener.on(this._userChannelGroup, func);
  }

  /**
   * Removes a handler for connection status updates.
   * If no handler is specified, removes all handlers
   * @param {Function} [func]
   */
  offConnectionStatusUpdates(func) {
    if (func) {
      this._pubnubListener.removeListener(PubNubListener.unclassifiedEvents, func);
      this._pubnubListener.removeListener(this._userChannelGroup, func);
    } else {
      this._pubnubListener.removeAllListeners(PubNubListener.unclassifiedEvents);
      this._pubnubListener.removeAllListeners(this._userChannelGroup);
    }
  }

  /**
   * @param {string} channelName The name of the PubNub channel to publish to
   * @param {Object} message The message to be published
   * @returns {Promise}
   */
  publishToChannel(channelName, message) {
    if (!this.isInitialized()) {
      return Promise.reject(new KinveyError('Live service is not initialized'));
    }

    const validationErr = this._validatePublishData(channelName, message);
    if (validationErr) {
      return Promise.reject(validationErr);
    }

    return this._pubnubClient.publish({
      message: message,
      channel: channelName
    })
      .catch((err) => {
        err = err.status && err.status.errorData;
        const resp = new Response({ data: err, statusCode: err.status, headers: err.response && err.response.headers });
        return Promise.reject(resp);
      });
  }

  /**
   * Start listening for events for specified channel
   * @param {string} channelName
   * @param {LiveServiceReceiver} receiver
   */
  subscribeToChannel(channelName, receiver) {
    const validationError = this._validateSubscribeData(channelName, receiver);
    if (validationError) {
      throw validationError;
    }
    this._subscribeToListener(channelName, receiver);
  }

  /**
   * Stop listening for events for specified channel
   * @param {string} channelName
   */
  unsubscribeFromChannel(channelName) {
    this._unsubscribeFromListener(channelName);
  }

  /**
   * @param {string} userId
   * @returns {Promise}
   */
  unregisterUser() {
    if (!this._registeredUser) {
      const msg = 'Cannot unregister when no user has been registered for live service';
      return Promise.reject(new KinveyError(msg));
    }

    const userId = this._registeredUser._id;
    return this._makeUnregisterRequst(userId)
      .then((resp) => {
        this._registeredUser = null;
        return resp;
      });
  }

  /**
   * Unsubscribes from all channels and channel groups, as well as PubNubListener events
   * @private
   */
  _unsubscribeFromAll() {
    this._pubnubClient.unsubscribeAll();
    this._pubnubListener.removeAllListeners();
  }

  /**
   * @param {string} channelName
   * @param {Object} message
   * @returns {KinveyError}
   */
  _validatePublishData(channelName, message) {
    let err = null;

    if (!isValidChannelName(channelName)) {
      err = new KinveyError('Invalid channel name');
    }

    if (message === undefined) {
      err = new KinveyError('Missing or invalid message');
    }

    return err;
  }

  /**
   * @param {string} channelName
   * @param {LiveServiceReceiver} channelName
   * @returns {KinveyError}
   */
  _validateSubscribeData(channelName, receiver) {
    let err = null;

    if (!isValidChannelName(channelName)) {
      err = new KinveyError('Invalid channel name');
    }

    if (!receiver || !isValidReceiver(receiver)) {
      err = new KinveyError('Missing or invalid receiver');
    }

    return err;
  }

  /**
   * Subscribes the PubNub client to the user's channel group.
   * All received messages are published to this channel group
   * and PubNubListener class routes and emits to their respective channels
   * @private
   * @param {string} channelGroup
   */
  _subscribeToUserChannelGroup() {
    this._pubnubClient.subscribe({
      channelGroups: [this._userChannelGroup]
    });
  }

  /**
   * Listens to respective PubNubListener events, based on channel name
   * @param  {string} channelName
   * @param  {LiveServiceReceiver} receiver
   */
  _subscribeToListener(channelName, receiver) {
    if (isFunction(receiver.onMessage)) {
      this._pubnubListener.on(channelName, receiver.onMessage);
    }

    if (isFunction(receiver.onError) || isFunction(receiver.onStatus)) {
      this._pubnubListener.on(`${PubNubListener.statusPrefix}${channelName}`, (status) => {
        const func = status.error ? receiver.onError : receiver.onStatus;
        if (isFunction(func)) {
          func.call(receiver, status);
        }
      });
    }
  }

  /**
   * Stop listening to respective PubNubListener events, based on channel name
   * @private
   * @param {string} channelName
   */
  _unsubscribeFromListener(channelName) {
    this._pubnubListener.removeAllListeners(channelName);
    this._pubnubListener.removeAllListeners(`${PubNubListener.statusPrefix}${channelName}`);
  }

  /**
   * @private
   * @param {string} userId
   * @returns {Promise<{publishKey: string, subscribeKey: string, userChannelGroup: string}>}
   */
  _makeRegisterRequest(userId) {
    return this._makeUserManagementRequest(userId, 'register-realtime');
  }

  /**
   * @private
   * @param {string} userId
   * @returns {Promise}
   */
  _makeUnregisterRequst(userId) {
    return this._makeUserManagementRequest(userId, 'unregister-realtime');
  }

  /**
   * @private
   * @param {string} path
   * @returns {Promise}
   */
  _makeUserManagementRequest(userId, path) {
    return KinveyRequest.executeShort({
      method: RequestMethod.POST,
      pathname: `/user/${this._client.appKey}/${userId}/${path}`,
      body: { deviceId: this._client.deviceId }
    }, this._client);
  }

  _throwNotInitializedError() {
    throw new KinveyError('Live service has not been initialized');
  }
}

let liveServiceInstance;

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

export {
  isValidChannelName,
  isValidReceiver
};
