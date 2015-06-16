import Request from './request';
import Rack from './Rack';

class CacheRequest extends Request {
  execute() {
    const rack = Rack.cacheRack();
    let promise = Promise.resolve();

    // Execute the request
    return rack.execute(this);
  }
}

export default CacheRequest;
