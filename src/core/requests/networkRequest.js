import Request from './request';
import NetworkRack from '../rack/networkRack';

export default class NetworkRequest extends Request {
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
