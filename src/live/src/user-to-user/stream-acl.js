/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "User" }] */
import { isArray } from 'lodash/isArray';

// TODO: imported for type definitions - is there a better way?
import { User } from '../../../entity';

/**
 * @class StreamACL
 */
export class StreamACL {

  /** @type {string[]} */
  publishers = [];
  /** @type {string[]} */
  subscribers = [];
  /** @type {string[]} */
  publisherGroups = [];
  /** @type {string[]} */
  subscriberGroups = [];

  /**
   * @param  {(User|User[]|string|string[])} publishers
   */
  addPublishers(publishers) {
    this._addToAcl(this.publishers, publishers);
  }

  /**
   * @param  {(User|User[]|string|string[])} subscribers
   */
  addSubscribers(subscribers) {
    this._addToAcl(this.subscribers, subscribers);
  }

  /**
   * @param  {(string|string[]|{_id: string})} groups
   */
  addPublisherGroups(groups) {
    this._addToAcl(this.publisherGroups, groups);
  }

  /**
   * @param  {(string|string[]|{_id: string})} groups
   */
  addSubscriberGroups(groups) {
    this._addToAcl(this.publisherGroups, groups);
  }

  /**
   * Converts the StreamACL object to a serializable object
   * @returns {{subscribe: string[], publish: string[], groups: { subscribe: string[], publish: string[] }}}
   */
  toPlainObject() {
    // TODO: make sure overwriting doesn't occur accidentally
    return {
      subscribe: this.subscribers.slice(0),
      publish: this.publishers.slice(0),
      groups: {
        subscribe: this.subscriberGroups.slice(0),
        publish: this.publisherGroups.slice(0)
      }
    };
  }

  /**
   * @private
   * @param {string[]} arr The appropriate array to add users to -
   *    subscribers (or groups of them) or publishers (or groups of them)
   * @param {(User|User[]|string|string[])} users
   */
  _addToAcl(arr, users) {
    const usersArr = isArray(users) ? users : [users];

    usersArr.forEach((subscriber) => {
      const id = subscriber._id ? subscriber._id : subscriber;
      arr.push(id);
    });
  }
}
