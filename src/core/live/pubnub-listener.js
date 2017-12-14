import { EventEmitter } from 'events';

/**
 * @typedef PubNubMessage
 * @property {string} channel The channel for which the message belongs
 * @property {string} subscription The channel group or wildcard subscription match (if exists)
 * @property {string|number} timetoken Publish timetoken
 * @property {Object} message The Payload
 */

/**
 * @typedef PubNubPresence
 * @property {string} action Can be join, leave, state-change or timeout
 * @property {string} channel The channel to which the message belongs
 * @property {string|number} occupancy Number of users connected to the channel
 * @property {string} state User State
 * @property {string} subscription The channel group or wildcard subscription match (if exists)
 * @property {string|number} timestamp Current timetoken
 * @property {string|number} timetoken Publish timetoken
 * @property {string[]} uuid UUIDs of users who are connected with the channel
 */

/**
 * @typedef PubNubStatus
 * @property {string} category The status category. An enum is in the PubNub docs. Example: PNConnectedCategory
 * @property {string} operation The operation the status is for. Example: PNSubscribeOperation
 * @property {string[]} affectedChannels The channels affected in the operation
 * @property {string[]} subscribedChannels All the current subscribed channels
 * @property {string[]} affectedChannelGroups The channel groups affected in the operation
 * @property {number} lastTimetoken The last timetoken used in the subscribe request
 * @property {number} currentTimetoken The current timetoken fetched in the subscribe response, which is going to be used in the next request
 */

const statusPrefix = 'status:';
const unclassifiedEvents = 'pubNubEventsNotRouted';

export class PubNubListener extends EventEmitter {

  static get statusPrefix() {
    return statusPrefix;
  }

  static get unclassifiedEvents() {
    return unclassifiedEvents;
  }

  /** @param {PubNubMessage} m */
  message(m) {
    this.emit(m.channel, m.message);
  }

  /** @param {PubNubStatus} s */
  status(s) {
    const allEvents = this._getEventNamesFromStatus(s.affectedChannels, s.affectedChannelGroups);
    if (allEvents.length) {
      allEvents.forEach((channelOrGroup) => {
        this.emit(`${PubNubListener.statusPrefix}${channelOrGroup}`, s);
      });
    } else {
      this.emit(PubNubListener.unclassifiedEvents, s);
    }
  }

  /**
   * @private
   * @param {string[]} [affectedChannels]
   * @param {string[]} [affectedChannelGroups]
   */
  _getEventNamesFromStatus(affectedChannels, affectedChannelGroups) {
    const channels = affectedChannels || [];
    const groups = affectedChannelGroups || [];
    return channels.concat(groups);
  }
}
