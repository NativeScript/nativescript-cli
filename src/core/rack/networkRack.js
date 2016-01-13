const Rack = require('./rack');
const Serialize = require('./serialize');
const Http = require('./http');
const Parse = require('./parse');
const sharedInstanceSymbol = Symbol();

class NetworkRack extends Rack {
  constructor(name = 'Kinvey Network Rack') {
    super(name);
    this.use(new Serialize());
    this.use(new Http());
    this.use(new Parse());
  }

  static sharedInstance() {
    let instance = NetworkRack[sharedInstanceSymbol];

    if (!instance) {
      instance = new NetworkRack();
      NetworkRack[sharedInstanceSymbol] = instance;
    }

    return instance;
  }
}

module.exports = NetworkRack;
