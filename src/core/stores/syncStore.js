const Store = require('./store');
const DataPolicy = require('../enums').DataPolicy;
const assign = require('lodash/object/assign');

class SyncStore extends Store {
  constructor(name, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.ForceLocal,
    }, options);
    super(name, options);
  }
}

module.exports = SyncStore;
