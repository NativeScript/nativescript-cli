const Store = require('./store');
const DataPolicy = require('../enums').DataPolicy;
const assign = require('lodash/object/assign');

class NetworkStore extends Store {
  constructor(name, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.PreferNetwork,
    }, options);
    super(name, options);
  }
}

module.exports = NetworkStore;
