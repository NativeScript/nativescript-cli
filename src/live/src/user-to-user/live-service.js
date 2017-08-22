import PubNub from 'pubnub';

import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import extend from 'lodash/extend';
import isString from 'lodash/isString';

import Client from '../../../client';
import { KinveyRequest, RequestMethod, Response } from '../../../request';
import { KinveyError, ActiveUserError } from '../../../errors';
import { PubNubListener } from './pubnub-listener';

/**
 * @typedef LiveServiceReceiver
 * @property {Function} onMessage
 * @property {Function} onError
 * @property {Function} onStatus
 */

class LiveService {
  /** @type {Client} @private */
  _client;
  /** @type {PubNub} @private */
  _pubnubClient;
  /** @type {PubNubListener} @private */
  _pubnubListener;
  /** @type {string} @private */
  _userChannelGroup;
  /** @type {Object} @private */
  _pubnubConfig
  /** @type {User} @private */
  _registeredUser;

  /**
   * @constructor
   * @param {Client} client
   */
  constructor(client) {
    this._client = client || Client.sharedInstance();
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

  fullInitialization(user) {
    return this.registerUser(user)
      .then((pubnubConfig) => {
        const pubnubClient = new PubNub(pubnubConfig);
        const listener = new PubNubListener();
        this.initialize(pubnubClient, listener);
      });
  }

  fullUninitialization() {
    let promise = Promise.resolve();

    if (this.isInitialized()) {
      promise = this.unregisterUser()
        .then((resp) => {
          this.uninitialize();
          return resp;
        });
    }

    return promise;
  }

  isInitialized() {
    return !!this.__pubnubClient && !!this.__pubnubListener && !!this._registeredUser;
  }

  /**
   * Registers the active user for live service
   * @returns {Promise}
   */
  registerUser(user) {
    if (!user || !user.isActive()) {
      return Promise.reject(new ActiveUserError('Missing or invalid active user'));
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
    this._pubnubListener = pubnubListener;
    this._pubnubClient = pubnubClient;
    this._pubnubClient.addListener(this._pubnubListener);
    this._subscribeToUserChannelGroup();
  }

  /**
   * Unsubscribes from all events in PubNub client and in listener
   */
  uninitialize() {
    this.unsubscribeFromAll();
    this._pubnubClient = null;
    this._pubnubListener = null;
  }

  onConnectionStatusUpdates(func) {
    this._pubnubListener.on(PubNubListener.unclassifiedEvents, func);
  }

  offConnectionStatusUpdates(func) {
    if (func) {
      this._pubnubListener.removeListener(PubNubListener.unclassifiedEvents, func);
    } else {
      this._pubnubListener.removeAllListeners(PubNubListener.unclassifiedEvents);
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

    if (isObject(message)) {
      message.senderId = this._registeredUser._id;
    }

    return this._pubnubClient.publish({
      message: message,
      channel: channelName
    })
      .catch((err) => {
        err = err.status.errorData;
        const resp = new Response({ data: err, statusCode: err.status, headers: err.response.headers });
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
   * Unsubscribes from all channels and channel groups, as well as PubNubListener events
   */
  unsubscribeFromAll() {
    this._pubnubClient.unsubscribeAll();
    this._pubnubListener.removeAllListeners();
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
   * @param {string} channelName
   * @param {Object} message
   * @returns {KinveyError}
   */
  _validatePublishData(channelName, message) {
    let err = null;

    if (!isString(channelName) || channelName === '') {
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

    if (!isString(channelName) || channelName === '') {
      err = new KinveyError('Invalid channel name');
    }

    if (!receiver || !this._isValidReceiver(receiver)) {
      err = new KinveyError('Missing or invalid receiver');
    }

    return err;
  }

  /**
   * @param {LiveServiceReceiver} receiver
   * @returns {Boolean}
   */
  _isValidReceiver(receiver) {
    const { onMessage, onError, onStatus } = receiver;
    return isFunction(onMessage) || isFunction(onError) || isFunction(onStatus);
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
    this._pubnubListener.removeAllListeners(channelName)
      .removeAllListeners(`${PubNubListener.statusPrefix}${channelName}`);
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
    }, this._client, true);
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
