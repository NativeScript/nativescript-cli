import url from 'url';
import PubNub from 'pubnub';

import Client from '../../../client';
import { KinveyRequest, RequestMethod, AuthType } from '../../../request';
import { KinveyError } from '../../../errors';
import { User } from '../../../entity';
import { PubNubListener } from './pubnub-listener';

class LiveService {

  /** @type {Client} */
  client;
  /** @type {User} */
  registeredUser;
  /** @type {string} */
  userChannelGroup;
  /** @type {PubNub} @private */
  _pubnubClient;
  /** @type {PubNubReceiver} @private */
  _pubnubListener;

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
    return this._makeRegisterRequest()
      .then((pubnubConfig) => {
        this.registeredUser = this.client.activeUser;
        this.userChannelGroup = pubnubConfig.userChannelGroup;

        this._pubnubClient = new PubNub({
          ssl: true,
          publishKey: pubnubConfig.publishKey,
          subscribeKey: pubnubConfig.subscribeKey,
          authKey: this.client.activeUser._kmd.authtoken
        });
        this._pubnubListener = new PubNubListener();
        this._pubnubClient.addListener(this._pubnubListener);

        return this.subscribeToChannelGroup(this.userChannelGroup);
      });
  }

  /**
   * @param {string} userId The user id
   * @returns {Promise}
   */
  unregisterUser() {
    return this._makeUnregisterRequst();
  }

  /**
   * @param {string} channelName The name of the PubNub channel to publish to
   * @param {Object} message The message to be published
   * @returns {Promise}
   */
  publishToChannel(channelName, message) {
    return this._pubnubClient.publish({
      message: message,
      channel: channelName
    })
      .then((resp) => {
        // TODO: map response to KinveyResponse
        return resp;
      })
      .catch((err) => {
        err = err.status;
        return Promise.reject(new KinveyError(err.errorData, null, err.statusCode));
      });
  }

  subscribeToChannel(channelName, receiver) {
    // this._pubnubClient.subscribe({
    //   channels: [channelName]
    // });

    this._subscribeToListener(channelName, receiver);
  }

  subscribeToChannelGroup(channelGroup) {
    this._pubnubClient.subscribe({
      channelGroups: [channelGroup]
    });

    // this._subscribeToListener(channelGroup, {
    //   onNext: resp => console.log('debug: onNext:', resp),
    //   onError: err => console.log('debug: onError:', err),
    //   onStatus: status => console.log('debug: onStatus:', status)
    // });
  }

  /**
   * @param {string} channelName
   */
  unsubscribeFromChannel(channelName) {
    this._pubnubClient.unsubscribe({
      channels: [channelName]
    });
    this._unsubscribeToListener(channelName);
  }

  unsubscribeFromAllChannels() {
    // TODO: remove from listener?
    this._pubnubClient.unsubscribeAll();
  }

  _subscribeToListener(channelName, receiver) {
    // TODO: rename on - move subscribe logic to PubNubListener
    this._pubnubListener.on(channelName, receiver.onNext.bind(receiver));
    this._pubnubListener.on(`${PubNubListener.statusPrefix}${channelName}`, (status) => {
      const func = status.error ? receiver.onError : receiver.onStatus;
      func.call(receiver, status);
    });
    // this._pubnubListener.on(`${PubNubListener.presencePrefix}${channelName}`, receiver.onPresence.bind(receiver));
  }

  _unsubscribeToListener(channelName) {
    this._pubnubListener.off(channelName);
    this._pubnubListener.off(`${PubNubListener.statusPrefix}${channelName}`);
    // this._pubnubListener.off(`${PubNubListener.presencePrefix}${channelName}`);
  }

  /**
   * @private
   * @param {string} userId The user id
   * @returns {Promise<{publishKey: string, subscribeKey: string, userChannelGroup: string}>}
   */
  _makeRegisterRequest() {
    return this._makeUserManagementRequest('register-realtime')
      .then(response => response.data);
  }

  /**
   * @private
   * @param {string} userId The user id
   * @returns {Promise}
   */
  _makeUnregisterRequst() {
    return this._makeUserManagementRequest('unregister-realtime')
      .then(response => response.data);
  }

  /**
   * @private
   * @param {string} path
   */
  _makeUserManagementRequest(path) {
    const activeUser = User.getActiveUser();
    return KinveyRequest.execute({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/user/${this.client.appKey}/${activeUser._id}/${path}`
      }),
      body: { deviceId: this.client.deviceId }
    });
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
