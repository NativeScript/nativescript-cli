import Request from './request';
import CacheRack from '../rack/cacheRack';

export default class LocalRequest extends Request {
  execute() {
    const promise = super.execute().then(() => {
      const rack = CacheRack.sharedInstance();
      return rack.execute(this);
    });

    return promise;
  }

  cancel() {
    const rack = CacheRack.sharedInstance();
    rack.cancel();
  }
}
