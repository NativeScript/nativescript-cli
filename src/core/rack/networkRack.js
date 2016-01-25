import Rack from './rack';
import Serialize from './serialize';
import Http from './http';
import Parse from './parse';
const sharedInstanceSymbol = Symbol();

export default class NetworkRack extends Rack {
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
