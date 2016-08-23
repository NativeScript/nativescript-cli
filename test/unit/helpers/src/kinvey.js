import { Kinvey } from '../../../../src/kinvey';
import { CacheRequest, NetworkRequest } from '../../../../src/request';
import { CacheRack, NetworkRack } from './rack';

export class TestKinvey extends Kinvey {
  static init(options) {
    const client = super.init(options);

    // Set CacheRequest rack
    CacheRequest.rack = new CacheRack();

    // Set NetworkRequest rack
    NetworkRequest.rack = new NetworkRack();

    return client;
  }
}
