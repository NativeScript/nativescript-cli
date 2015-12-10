const Store = require('./store');
const DataPolicy = require('../enums').DataPolicy;
const assign = require('lodash/object/assign');

class LocalStore extends Store {
  constructor(name, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.PreferLocal,
    }, options);
    super(name, options);
  }
}

module.exports = LocalStore;
