import { Rack } from 'kinvey-rack/src/rack';
import { CacheMiddleware } from './cache';
import { ParseMiddleware } from './parse';
import { SerializeMiddleware } from './serialize';
import { HttpMiddleware } from './http';

/**
 * @private
 */
export class KinveyRack extends Rack {
  async execute(request) {
    request = await super.execute(request);
    return request.response;
  }
}

/**
 * @private
 */
export class KinveyCacheRack extends KinveyRack {
  constructor(name = 'Kinvey Cache Rack') {
    super(name);
    this.use(new CacheMiddleware());
  }
}

/**
 * @private
 */
export class KinveyNetworkRack extends KinveyRack {
  constructor(name = 'Kinvey Network Rack') {
    super(name);
    this.use(new SerializeMiddleware());
    this.use(new HttpMiddleware());
    this.use(new ParseMiddleware());
  }
}

/**
 * @private
 */
class KinveyRackManager {
  constructor() {
    this.cacheRack = new KinveyCacheRack();
    this.networkRack = new KinveyNetworkRack();
  }
}
const kinveyRackManager = new KinveyRackManager();
export { kinveyRackManager as KinveyRackManager };
