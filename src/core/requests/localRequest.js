const Request = require('./request');
const CacheRack = require('../rack/cacheRack');

class LocalRequest extends Request {
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

module.exports = LocalRequest;
