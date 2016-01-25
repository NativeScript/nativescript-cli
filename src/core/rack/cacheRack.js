import Rack from './rack';
import Cache from './cache';
const sharedInstanceSymbol = Symbol();

export default class CacheRack extends Rack {
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
