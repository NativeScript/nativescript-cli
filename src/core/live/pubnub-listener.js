import { EventEmitter } from 'events';

const statusPrefix = 'status:';
const unclassifiedEvents = 'pubNubEventsNotRouted';

/**
 * @private
 */
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
