import utils from './utils';
import HttpMethod from '../enums/httpMethod';
import Rack from './rack';
import AuthType from '../enums/authType';
import CacheRequest from './cacheRequest';
import Auth from './auth';
import Request from './request';

class NetworkRequest extends Request {
  constructor(method = HttpMethod.GET, path = '', query = {}, data = {}) {
    super(method, path, query, data);

    // Set request info
    this.authType = AuthType.None;
  }

  set authType(authType) {
    switch (authType) {
      case AuthType.App:
        this._auth = Auth.app;
        break;
      case AuthType.None:
        this._auth = Auth.none;
        break;
      default:
        this._auth = Auth.def;
        break;
    }
  }

  get cacheKey() {
    return `${JSON.stringify(this.toJSON())}`;
  }

  cache() {
    // Create a cache request
    let cacheRequest = new CacheRequest(HttpMethod.POST, this.path, this.query, this.data);
    cacheRequest.authType = this.authType;
    cacheRequest.headers = this.headers;

    // Execute the cache request
    return cacheRequest.execute();
  }

  getCache() {
     // Create a cache request
    let cacheRequest = new CacheRequest(HttpMethod.GET, this.path, this.query, this.data);
    cacheRequest.authType = this.authType;
    cacheRequest.headers = this.headers;

    // Execute the cache request
    return cacheRequest.execute();
  }

  clearCache() {
    // Create a cache request
    let cacheRequest = new CacheRequest(HttpMethod.DELETE, this.path, this.query, this.data);
    cacheRequest.authType = this.authType;
    cacheRequest.headers = this.headers;

    // Execute the cache request
    return cacheRequest.execute();
  }

  execute(options = {}) {
    const auth = this._auth;
    const networkRack = Rack.networkRack;
    let promise = Promise.resolve();

    return promise.then(() => {
      if (utils.isDefined(auth)) {
        promise = utils.isFunction(auth) ? auth() : Promise.resolve(auth);

        // Add auth info to headers
        return promise.then((authInfo) => {
          if (auth !== null) {
            // Format credentials
            let credentials = authInfo.credentials;
            if (utils.isDefined(authInfo.username)) {
              credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
            }

            // Set the header
            this.setHeader('Authorization', `${authInfo.scheme} ${credentials}`);
          }
        });
      }
    }).then(() => {
      // Execute the request
      return networkRack.execute(this);
    }).then((response) => {
      if (options.cache) {
        return this.cache().then(() => {
          return response;
        });
      }

      return response;
    });
  }
}

export default NetworkRequest;
