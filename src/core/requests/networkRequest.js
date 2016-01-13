const Request = require('./request');
const NetworkRack = require('../rack/networkRack');
const HttpMethod = require('../enums').HttpMethod;
const CacheRequest = require('./cacheRequest');

class NetworkRequest extends Request {
  execute() {
    const promise = super.execute().then(() => {
      const networkRack = NetworkRack.sharedInstance();
      return networkRack.execute(this);
    }).then(response => {
      if (response && response.isSuccess()) {
        const cacheRequest = new CacheRequest(this);
        cacheRequest.data = response.data;

        if (this.method === HttpMethod.GET) {
          cacheRequest.method = HttpMethod.PUT;
        }

        return cacheRequest.execute().then(() => {
          return response;
        });
      }

      return response;
    });

    return promise;
  }

  cancel() {
    const networkRack = NetworkRack.sharedInstance();
    networkRack.cancel();
  }
}

module.exports = NetworkRequest;
