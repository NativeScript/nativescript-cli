import Acl from '../acl';
import Metadata from '../metadata';
import Client from '../client';
import defaults from 'lodash/defaults';
import result from 'lodash/result';
import clone from 'lodash/clone';
import assign from 'lodash/assign';
const localIdPrefix = process.env.KINVEY_ID_PREFIX || 'local_';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const aclAttribute = process.env.KINVEY_ACL_ATTRIBUTE || '_acl';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

/**
 * @private
 */
export default class Model {
  constructor(attributes = {}) {
    this.client = Client.sharedInstance();
    this.set(defaults({}, attributes, result(this, 'defaults', {})));
  }

  get id() {
    return this.get(idAttribute);
  }

  get _id() {
    return this.id;
  }

  set id(id) {
    this.set(idAttribute, id);
  }

  set _id(id) {
    this.id = id;
  }

  get acl() {
    return new Acl(this.get(aclAttribute));
  }

  get _acl() {
    return this.acl;
  }

  set acl(acl) {
    this.set(aclAttribute, result(acl, 'toJSON', acl));
  }

  set _acl(kmd) {
    this.kmd = kmd;
  }

  get metadata() {
    return new Metadata(this.get(kmdAttribute));
  }

  get _kmd() {
    return this.get(kmdAttribute);
  }

  set _kmd(kmd) {
    this.set(kmdAttribute, result(kmd, 'toJSON', kmd));
  }

  get defaults() {
    const defaults = {};
    return defaults;
  }

  get(attr) {
    return this.attributes[attr];
  }

  has(attr) {
    return this.get(attr) ? true : false;
  }

  set(key, val, options = {}) {
    if (!key) {
      return this;
    }

    let attrs;
    if (typeof key === 'object') {
      attrs = key;
      options = val || {};
    } else {
      (attrs = {})[key] = val;
    }

    const unset = options.unset;
    const currentAttributes = clone(this.attributes || {});

    for (const attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        val = attrs[attr];

        if (unset) {
          delete currentAttributes[attr];
        } else {
          currentAttributes[attr] = val;
        }
      }
    }

    this.attributes = currentAttributes;
    return this;
  }

  unset(attr, options = {}) {
    return this.set(attr, undefined, assign({}, options, { unset: true }));
  }

  isNew() {
    return !this.has(idAttribute) || this.id.indexOf(localIdPrefix) === 0;
  }

  toJSON() {
    return clone(this.attributes, true);
  }
}
