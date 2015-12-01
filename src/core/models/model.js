const Acl = require('../acl');
const Metadata = require('../metadata');
const defaults = require('lodash/object/defaults');
const result = require('lodash/object/result');
const clone = require('lodash/lang/clone');
const assign = require('lodash/object/assign');
const objectIdPrefix = process.env.KINVEY_OBJECT_ID_PREFIX || 'local_';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const aclAttribute = process.env.KINVEY_ACL_ATTRIBUTE || '_acl';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

class Model {
  constructor(attributes = {}, options = {}) {
    this.attributes = {};
    attributes = defaults({}, attributes, result(this, 'defaults', {}));
    this.set(attributes, options);
  }

  get id() {
    return this.get(idAttribute);
  }

  get _id() {
    return this.id;
  }

  get acl() {
    return new Acl(this.get(aclAttribute));
  }

  get _acl() {
    return this.acl;
  }

  get kmd() {
    return new Metadata(this.get(kmdAttribute));
  }

  get _kmd() {
    return this.kmd;
  }

  get defaults() {
    const defaults = {};
    defaults[idAttribute] = this.generateObjectId();
    defaults[kmdAttribute] = {
      ect: new Date().toISOString(),
      lmt: new Date().toISOString()
    };
    return defaults;
  }

  get objectIdPrefix() {
    return objectIdPrefix;
  }

  generateObjectId(length = 24) {
    const chars = 'abcdef0123456789';
    let result = '';

    for (let i = 0, j = chars.length; i < length; i += 1) {
      const pos = Math.floor(Math.random() * j);
      result += chars.substring(pos, pos + 1);
    }

    return `${this.objectIdPrefix}${result}`;
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
      options = val;
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
    const id = this.id;
    return !this.has(idAttribute) || id.indexOf(this.objectIdPrefix) === 0;
  }

  toJSON() {
    const json = {
      _acl: this.acl.toJSON(),
      _kmd: this.kmd.toJSON()
    };

    for (const key in this.attributes) {
      if (this.attributes.hasOwnProperty(key) && (key !== aclAttribute || key !== kmdAttribute)) {
        json[key] = this.attributes[key];
      }
    }

    return clone(json);
  }
}

module.exports = Model;
