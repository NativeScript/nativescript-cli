const Store = require('./store');
const DataPolicy = require('../enums').DataPolicy;
const WritePolicy = require('../enums').WritePolicy;
const assign = require('lodash/object/assign');

class CacheStore extends Store {
  constructor(name, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.PreferLocal
    }, options);
    options.writePolicy = WritePolicy.Local;
    super(name, options);
  }
}

module.exports = CacheStore;
