import CoreObject from './object';

class Entity extends CoreObject {
  constructor(data = {}) {
    super();
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  save() {
    return Promise.resolve(this);
  }
}

export default Entity;
