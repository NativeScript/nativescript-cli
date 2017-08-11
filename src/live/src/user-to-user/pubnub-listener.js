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

export class PubNubListener extends EventEmitter {
  static statusPrefix = 'status:';
  static presencePrefix = 'presence:';

  /** @param {PubNubMessage} m */
  message(m) {
    this.emit(m.channel, m.message);
    // this.emit(m.subscription, m.message); // any point in this?
  }

  /** @param {PubNubStatus} s */
  status(s) {
    // TODO: do better
    // if (s.error) {
    //   return this.emit();
    // }

    const channels = s.affectedChannels || [];
    const groups = s.affectedChannelGroups || [];
    const allEvents = channels.concat(groups);
    allEvents.forEach((channelOrGroup) => {
      this.emit(`${PubNubListener.statusPrefix}${channelOrGroup}`, s);
    });
  }

  /** @param {PubNubPresence} p */
  presence(p) {
    // this.emit(`${PubNubListener.statusPresence}${p.channel}`, p);
    // this.emit(`${PubNubListener.statusPresence}${p.subscription}`, p);
    console.log('presence', p);
  }
}
