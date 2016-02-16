import { KinveyRack } from '../rack';
import { CacheMiddleware } from '../middleware/cache';
const sharedInstanceSymbol = Symbol();

/**
 * @private
 */
export class CacheRack extends KinveyRack {
  constructor(name = 'Kinvey Cache Rack') {
    super(name);
    this.use(new CacheMiddleware());
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
