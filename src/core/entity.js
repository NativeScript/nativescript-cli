import CoreObject from './object';
import LocalDataStore from './localDataStore';

class Entity extends CoreObject {
  constructor(data = {}) {
    super();
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  save(options = {}) {
    // Save the entity locally
    if (options.local) {
      return LocalDataStore.save(this.toJSON()).then(() => {
        return this;
      });
    }
  }
}

export default Entity;
