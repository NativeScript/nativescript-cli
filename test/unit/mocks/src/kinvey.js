import { Kinvey } from '../../../../src/kinvey';
import { CacheRack, NetworkRack } from './rack';

export default class TestKinvey extends Kinvey {
  static init(options = {}) {
    options.cacheRack = options.cacheRack || new CacheRack();
    options.networkRack = options.networkRack = new NetworkRack();
    return super.init(options);
  }
}
