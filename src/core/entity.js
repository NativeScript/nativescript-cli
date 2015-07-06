import CoreObject from './object';

class Entity extends CoreObject {
  constructor(data = {}) {
    super();
    this.data = data;
  }

  get _id() {
    return this.data._id;
  }

  get _kmd() {
    return this.data._kmd;
  }

  toJSON() {
    return this.data;
  }

  static create() {
    return Promise.resolve(this);
  }

  save() {
    return Promise.resolve(this);
  }

  static update() {
    return Promise.resolve(this);
  }

  static find() {
    return Promise.resolve(this);
  }

  static get() {
    return Promise.resolve(this);
  }

  static destroy() {
    return Promise.resolve(this);
  }

  static restore() {
    return Promise.resolve(this);
  }

  static count() {
    return Promise.resolve(this);
  }

  static group() {
    return Promise.resolve(this);
  }
}

export default Entity;
