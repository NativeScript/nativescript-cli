import CoreObject from './object';
import OfflinePolicy from '../enums/offlinePolicy';
import Local from './local';
import Net from './net';

class Persistence extends CoreObject {

  static read(request, options = {}) {
    let offlinePolicy = options.offlinePolicy || OfflinePolicy.OnlineFirst;
    let promise;

    if (offlinePolicy === OfflinePolicy.LocalFirst) {
      promise = Local.read(request, options).then(null, () => {
        return Net.read(request, options);
      });
    }
    else if (offlinePolicy === OfflinePolicy.OnlineFirst) {
      promise = Net.read(request, options).then(null, () => {
        return Local.read(request, options);
      });
    }
    else {
      promise = Net.read(request, options);
    }

    return promise.then((response) => {
      // Update the local if offline policy is not AlwaysOnline
      if (offlinePolicy !== OfflinePolicy.AlwaysOnline) {
        request.data = response;
        return Local.update(request, options).then(() => {
          return response;
        });
      }

      // Return the response
      return response;
    }, (err) => {
      // Destroy the entity locally if the entity was not found
      if (err.name === 'EntityNotFound') {
        return Local.destroy(request, options).then(() => {
          return Promise.reject(err);
        });
      }

      return Promise.reject(err);
    });
  }
}

export default Persistence;
