import PubNub from 'pubnub';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import extend from 'lodash/extend';

import Client from '../../../client';
import { KinveyRequest, RequestMethod, Response } from '../../../request';
import { KinveyError, ActiveUserError } from '../../../errors';
import { PubNubListener } from './pubnub-listener';

/**
 * @typedef LiveServiceReceiver
 * @property {Function} onNext
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
      const msg = 'Live service has not been initialized. Please call register() first';
      throw new KinveyError(msg);
    }
    return this.__pubnubClient;
  }

  set _pubnubClient(value) {
    this.__pubnubClient = value;
  }

  isInitialized() {
    return !!this.__pubnubClient && !!this._pubnubListener;
  }

  /**
   * Registers the active user for live service
   * @returns {Promise}
   */
  register() {
    const activeUser = this._client.activeUser;
    if (!activeUser) {
      return Promise.reject(new ActiveUserError('There is no active user'));
    }

    return this._makeRegisterRequest(activeUser._id)
      .then((pubnubConfig) => {
        this._registeredUser = activeUser;
        this._pubnubConfig = extend({
          ssl: true,
          authKey: this._registeredUser._kmd.authtoken
        }, pubnubConfig);

        this._pubnubListener = new PubNubListener();
        this._userChannelGroup = pubnubConfig.userChannelGroup;
        this._pubnubClient = this._initPubNubClient(this._pubnubConfig, this._pubnubListener);
        return this._subscribeToUserChannelGroup();
      });
  }

  unregister() {
    this.unsubscribeFromAll();
    this._pubnubClient = null;
    this._pubnubListener = null;
    return this._unregisterUser();
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
      return Promise.reject(new KinveyError('Live service is not initialized. Please call its "register()" method'));
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
    if (!isObject(receiver)) {
      receiver = {};
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
   * @private
   * @param {string} userId The user id
   * @returns {Promise}
   */
  _unregisterUser() {
    const id = this._registeredUser && this._registeredUser._id;
    return this._makeUnregisterRequst(id);
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
    if (isFunction(receiver.onNext)) {
      this._pubnubListener.on(channelName, receiver.onNext);
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
   * @private
   * @param {{subscribeKey: string, publishKey?: string, authKey: string, ssl?: boolean}} config
   * @param {PubNubListener} listener
   */
  _initPubNubClient(config, listener) {
    const client = new PubNub({
      ssl: config.ssl,
      publishKey: config.publishKey,
      subscribeKey: config.subscribeKey,
      authKey: config.authKey
    });

    client.addListener(listener);
    return client;
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
   * @param {string} userId The user id
   * @returns {Promise<{publishKey: string, subscribeKey: string, userChannelGroup: string}>}
   */
  _makeRegisterRequest(userId) {
    return this._makeUserManagementRequest(userId, 'register-realtime');
  }

  /**
   * @private
   * @param {string} userId The user id
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
}

let liveServiceInstance;
let liveServiceInstanceFacade;

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

export function getLiveServiceFacade(client) {
  if (!liveServiceInstanceFacade) {
    const liveService = getLiveService(client);

    liveServiceInstanceFacade = {
      register: liveService.register.bind(liveService),
      unregister: liveService.unregister.bind(liveService),
      onConnectionStatusUpdates: liveService.onConnectionStatusUpdates.bind(liveService),
      offConnectionStatusUpdates: liveService.offConnectionStatusUpdates.bind(liveService),
      unsubscribeFromAll: liveService.unsubscribeFromAll.bind(liveService)
    };
  }
  return liveServiceInstanceFacade;
}
