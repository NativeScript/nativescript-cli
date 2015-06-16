import CoreObject from './object';
import Persistence from './persistence';
import Auth from './auth';
const dataStoreNamespace = 'appdata';

class DataStore extends CoreObject {
  constructor() {
    super();

    // Set defaults
    this.localDataStore = false;
  }

  enableLocalDataStore() {
    this.localDataStore = true;
  }

  disableLocalDataStore() {
    this.localDataStore = false;
  }

  isLocalDataStoreEnabled() {
    return this.localDataStore === true ? true : false;
  }

  find(collection, query, options = {}) {
    let request;
    let promise;

    // Create the request
    if (this.isLocalDataStoreEnabled()) {
      request = new LocalRequest();
    }
    else {
      request = new NetworkRequest();
    }

    // Execute the request
    promise = request.execute().then((response) => {
      // Cache the request
      return request.cache().then(() => {
        // Return the response data
        return response.data;
      });
    });

    return promise;

    // return Persistence.read({
    //   namespace: dataStoreNamespace,
    //   collection: collection,
    //   query: query,
    //   auth: Auth.default
    // }, options);
  }
}

// Execute request against the network with cache enabled
// GET /books
// 1) Execute request on cache rack
// 2a) Resolved - Go to 3
// 2b) Rejected - Execute request on network rack
// 3) Execute save request on cache rack
// 4) Return response

