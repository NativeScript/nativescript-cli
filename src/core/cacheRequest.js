import Request from './request';
import Rack from './Rack';

class CacheRequest extends Request {
  constructor(method, cacheKey) {
    super(method);
    this.cacheKey = cacheKey;
  }

  execute() {
    const rack = Rack.cacheRack;
    return rack.execute(this).then((response) => {
      // Set the response
      this.response = response;

      // Return the response
      return response;
    });
  }
}

export default CacheRequest;
