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
      if (response) {
        const data = response.data;
        let promise;

        if (this.method === HttpMethod.GET) {
          const cacheRequest = new CacheRequest({
            method: HttpMethod.PUT,
            properties: this.properties,
            protocol: this.protocol,
            host: this.host,
            pathname: this.pathname,
            headers: this.headers,
            auth: this.auth,
            flags: this.flags,
            query: this.query,
            data: data,
            timeout: this.timeout
          });
          promise = cacheRequest.execute();
        } else {
          const cacheRequest = new CacheRequest({
            method: this.method,
            properties: this.properties,
            protocol: this.protocol,
            host: this.host,
            pathname: this.pathname,
            headers: this.headers,
            auth: this.auth,
            flags: this.flags,
            query: this.query,
            data: data,
            timeout: this.timeout
          });
          promise = cacheRequest.execute();
        }

        return promise.then(() => {
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
