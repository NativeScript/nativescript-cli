import { KinveyRack } from '../rack';
import { SerializeMiddleware } from '../middleware/serialize';
import { HttpMiddleware } from '../middleware/http';
import { ParseMiddleware } from '../middleware/parse';
const sharedInstanceSymbol = Symbol();

/**
 * @private
 */
export class NetworkRack extends KinveyRack {
  constructor(name = 'Kinvey Network Rack') {
    super(name);
    this.use(new SerializeMiddleware());
    this.use(new HttpMiddleware());
    this.use(new ParseMiddleware());
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
