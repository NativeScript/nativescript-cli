const Rack = require('./rack');
const Cache = require('./cache');
const sharedInstanceSymbol = Symbol();

class CacheRack extends Rack {
  constructor(name = 'Kinvey Cache Rack') {
    super(name);
    this.use(new Cache());
  }

  static sharedInstance() {
    let instance = CacheRack[sharedInstanceSymbol];

    if (!instance) {
      instance = new CacheRack();
      CacheRack[sharedInstanceSymbol] = instance;
    }

    return instance;
  }
}

module.exports = CacheRack;
