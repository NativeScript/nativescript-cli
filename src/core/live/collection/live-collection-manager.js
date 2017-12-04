import { Client } from '../../client';
import { KinveyError } from '../../errors';
import { KinveyRequest, RequestMethod } from '../../request';
import { getLiveService, isValidReceiver, isValidChannelName } from '../live-service';

export class LiveCollectionManager {
  /**
   * @param {Client} client
   */
  constructor(client) {
    this._client = client || Client.sharedInstance();
  }

  subscribeCollection(name, receiver) {
    if (!isValidChannelName(name)) {
      return Promise.reject(new KinveyError('Invalid or missing collection name'));
    }

    if (!isValidReceiver(receiver)) {
      return Promise.reject(new KinveyError('Invalid or missing receiver'));
    }

    return this._makeSubscriptionRequest(name, '_subscribe')
      .then(() => {
        const channelName = this._buildChannelName(name);
        const personalChannelName = this._buildPersonalChannelName(name);
        const liveService = getLiveService();
        liveService.subscribeToChannel(channelName, receiver);
        liveService.subscribeToChannel(personalChannelName, receiver);
      });
  }

  unsubscribeCollection(name) {
    if (!isValidChannelName(name)) {
      return Promise.reject(new KinveyError('Invalid or missing collection name'));
    }

    return this._makeSubscriptionRequest(name, '_unsubscribe')
      .then(() => {
        const channelName = this._buildChannelName(name);
        const personalChannelName = this._buildPersonalChannelName(name);
        const liveService = getLiveService();
        liveService.unsubscribeFromChannel(channelName);
        liveService.unsubscribeFromChannel(personalChannelName);
      });
  }

  /**
   * Builds the expected channel name, used when receiving messages from PubNub
   * @private
   * @param {string} collectionName
   */
  _buildChannelName(collectionName) {
    return `${this._client.appKey}.c-${collectionName}`;
  }

  _buildPersonalChannelName(collectionName) {
    const channelName = this._buildChannelName(collectionName);
    const userId = this._client.getActiveUser()._id;
    return `${channelName}.u-${userId}`;
  }

  /**
   * @private
   * @param {string} collectionName
   * @param {string} path
   */
  _makeSubscriptionRequest(collectionName, path) {
    return KinveyRequest.executeShort({
      method: RequestMethod.POST,
      pathname: `/appdata/${this._client.appKey}/${collectionName}/${path}`,
      body: { deviceId: this._client.deviceId }
    });
  }
}

/** @type {LiveCollectionManager} */
let managerInstance;

/**
 * @param {Client} client
 */
export function getLiveCollectionManager(client) {
  if (!managerInstance) {
    managerInstance = new LiveCollectionManager(client);
  }
  return managerInstance;
}
