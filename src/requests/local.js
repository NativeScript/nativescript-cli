import { KinveyRequest } from './request';
import { CacheRack } from '../rack/rack';

/**
 * @private
 */
export class LocalRequest extends KinveyRequest {
  constructor(options) {
    super(options);
    this.rack = CacheRack.sharedInstance();
  }
}
