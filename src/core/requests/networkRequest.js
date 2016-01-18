const Request = require('./request');
const NetworkRack = require('../rack/networkRack');

class NetworkRequest extends Request {
  execute() {
    const promise = super.execute().then(() => {
      const networkRack = NetworkRack.sharedInstance();
      return networkRack.execute(this);
    });

    return promise;
  }

  cancel() {
    const networkRack = NetworkRack.sharedInstance();
    networkRack.cancel();
  }
}

module.exports = NetworkRequest;
