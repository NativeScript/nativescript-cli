const Request = require('./request');
const CacheRack = require('../rack/cacheRack');

class CacheRequest extends Request {
  execute() {
    const promise = super.execute().then(() => {
      const cacheRack = CacheRack.sharedInstance();
      return cacheRack.execute(this);
    });

    return promise;
  }

  cancel() {
    const cacheRack = CacheRack.sharedInstance();
    cacheRack.cancel();
  }
}

module.exports = CacheRequest;
