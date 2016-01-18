const Acl = require('../acl');
const Kmd = require('../kmd');
import Client from '../client';
const defaults = require('lodash/object/defaults');
const result = require('lodash/object/result');
const clone = require('lodash/lang/clone');
import assign from 'lodash/object/assign';
// import uniqueId from 'lodash/utility/uniqueId';
const localIdPrefix = process.env.KINVEY_ID_PREFIX || 'local_';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const aclAttribute = process.env.KINVEY_ACL_ATTRIBUTE || '_acl';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

class Model {
  constructor(attributes = {}, options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    this.client = options.client;
    this.attributes = {};
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

  get kmd() {
    return new Kmd(this.get(kmdAttribute));
  }

  get _kmd() {
    return this.kmd;
  }

  set kmd(kmd) {
    this.set(kmdAttribute, result(kmd, 'toJSON', kmd));
  }

  set _kmd(kmd) {
    this.kmd = kmd;
  }

  get defaults() {
    const defaults = {};
    defaults[kmdAttribute] = {
      ect: new Date().toISOString(),
      lmt: new Date().toISOString()
    };
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
    const currentAttributes = clone(this.attributes);

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
    const json = {
      _acl: this.acl.toJSON(),
      _kmd: this.kmd.toJSON()
    };

    for (const key in this.attributes) {
      if (this.attributes.hasOwnProperty(key)) {
        if (key === aclAttribute || key === kmdAttribute) {
          continue;
        }

        json[key] = this.attributes[key];
      }
    }

    return clone(json, true);
  }
}

module.exports = Model;
