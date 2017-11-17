const isArray = require('lodash/isArray');
const every = require('lodash/every');
const { KinveyError } = require('kinvey-errors');
const { isNonemptyString } = require('kinvey-utils/string');

const invalidValueMsg = 'Invalid ACL object value';

/**
 * @typedef {object} PlainACLObject
 * @property {string[]} [publish]
 * @property {string[]} [subscribe]
 * @property {{publish?: string[], subscribe?: string[]}} [groups]
 */

class StreamACL {
  constructor(obj) {
    this.publishers = [];
    this.subscribers = [];
    this.publisherGroups = [];
    this.subscriberGroups = [];

    if (obj) {
      if ((obj instanceof StreamACL)) {
        obj = obj.toPlainObject();
      }
      this._parsePlainObject(obj);
    }
  }

  /**
   * Checks if specified object has valid values for any
   * of the valid fiends for an ACL object
   * @param {object} obj Object to validate
   * @returns {boolean}
   */
  static isValidACLObject(obj) {
    try {
      const acl = new StreamACL(obj);
      return acl.isNotEmpty();
    } catch (err) {
      return false;
    }
  }

  /**
   * @param  {(User|User[]|string|string[])} publishers
   * @returns {this}
   */
  addPublishers(publishers) {
    this._addToAcl(this.publishers, publishers);
    return this;
  }

  /**
   * @param  {(User|User[]|string|string[])} subscribers
   * @returns {this}
   */
  addSubscribers(subscribers) {
    this._addToAcl(this.subscribers, subscribers);
    return this;
  }

  /**
   * @param  {(string|string[]|{_id: string})} groups
   * @returns {this}
   */
  addPublisherGroups(groups) {
    this._addToAcl(this.publisherGroups, groups);
    return this;
  }

  /**
   * @param  {(string|string[]|{_id: string})} groups
   * @returns {this}
   */
  addSubscriberGroups(groups) {
    this._addToAcl(this.subscriberGroups, groups);
    return this;
  }

  /**
   * @param  {(User|User[]|string|string[])} publishers
   * @returns {this}
   */
  removePublishers(publishers) {
    this._removeFromAcl(this.publishers, publishers);
    return this;
  }

  /**
   * @param  {(User|User[]|string|string[])} subscribers
   * @returns {this}
   */
  removeSubscribers(subscribers) {
    this._removeFromAcl(this.subscribers, subscribers);
    return this;
  }

  /**
   * @param  {(string|string[]|{_id: string})} groups
   * @returns {this}
   */
  removePublisherGroups(groups) {
    this._removeFromAcl(this.publisherGroups, groups);
    return this;
  }

  /**
   * @param  {(string|string[]|{_id: string})} groups
   * @returns {this}
   */
  removeSubscriberGroups(groups) {
    this._removeFromAcl(this.subscriberGroups, groups);
    return this;
  }

  /**
   * Indicates whether the current object has any user IDs,
   * in any of its fields
   * @returns {Boolean}
   */
  isNotEmpty() {
    return this.publishers.length
      || this.subscribers.length
      || this.publisherGroups.length
      || this.subscriberGroups.length;
  }

  /**
   * Converts the StreamACL object to a serializable object
   * @returns {PlainACLObject}
   */
  toPlainObject() {
    const res = {};

    if (this.subscribers.length) {
      res.subscribe = this.subscribers.slice(0);
    }
    if (this.publishers.length) {
      res.publish = this.publishers.slice(0);
    }

    if (this.subscriberGroups.length) {
      res.groups = res.groups || {};
      res.groups.subscribe = this.addSubscriberGroups.slice(0);
    }

    if (this.publisherGroups.length) {
      res.groups = res.groups || {};
      res.groups.publish = this.publisherGroups.slice(0);
    }

    return res;
  }

  /**
   * Populates current instance with data from a {@link {PlainACLObject}} object
   * @private
   * @param {PlainACLObject} plainACLObject
   */
  _parsePlainObject(plainACLObject) {
    if (plainACLObject.subscribe) {
      this.subscribers = this._ensureValidIdArray(plainACLObject.subscribe);
    }

    if (plainACLObject.publish) {
      this.publishers = this._ensureValidIdArray(plainACLObject.publish);
    }

    if (plainACLObject.groups) {
      if (plainACLObject.groups.publish) {
        this.publisherGroups = this._ensureValidIdArray(plainACLObject.groups.publish);
      }

      if (plainACLObject.groups.subscribe) {
        this.subscriberGroups = this._ensureValidIdArray(plainACLObject.groups.subscribe);
      }
    }
  }

  /**
   * Ensures that the specified array contains only nonempty strings
   * so that it can be assigned to a {@link StreamACL} property
   * @private
   * @param {string[]} arr An array to validate
   * @returns {string[]} The same array, if it is valid
   */
  _ensureValidIdArray(arr) {
    const isValid = this._isValidIdArray(arr);
    if (!isValid) {
      throw new KinveyError(invalidValueMsg);
    }
    return arr;
  }

  /**
   * @private
   * @param {string[]} arr
   * @returns {boolean}
   */
  _isValidIdArray(arr) {
    return isArray(arr) && every(arr, (o) => {
      const id = this._getAsId(o);
      return isNonemptyString(id);
    });
  }

  /**
   * @private
   * @param {string[]} arr The appropriate array to add users to -
   *    subscribers (or groups of them) or publishers (or groups of them)
   * @param {(User|User[]|string|string[])} users
   */
  _addToAcl(arr, users) {
    const usersArr = isArray(users) ? users : [users];
    const isValid = this._isValidIdArray(usersArr);
    if (!isValid) {
      throw new KinveyError(invalidValueMsg);
    }

    usersArr.forEach((u) => {
      const id = this._getAsId(u);
      arr.push(id);
    });
  }

  /**
   * @private
   * @param {string[]} arr The appropriate array to add users to -
   *    subscribers (or groups of them) or publishers (or groups of them)
   * @param {(User|User[]|string|string[])} users
   */
  _removeFromAcl(arr, users) {
    const usersArr = isArray(users) ? users : [users];

    usersArr.forEach((u) => {
      const id = this._getAsId(u);
      const index = arr.indexOf(id);
      if (index >= 0) {
        arr.splice(index, 1);
      }
    });
  }

  /**
   * @private
   * @param {Object} object Object which contains an "_id" property or is itself an id
   * @returns {string} The value of the "_id" property of the object, or the object itself, if it doesn't have such a property
   */
  _getAsId(o) {
    return (o && o._id) ? o._id : o;
  }
}
exports.StreamACL = StreamACL;
