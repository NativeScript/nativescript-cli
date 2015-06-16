import utils from './utils';
import Kinvey from '../kinvey';
import url from 'url';
import HttpMethod from '../enums/httpMethod';
import Rack from './rack';
import Query from './query';
import AuthType from '../enums/authType';
import Rack from 'kinvey-rack';
import CacheRequest from './cacheRequest';

class Request extends Rack.Request {
  constructor(method = HttpMethod.GET, path = '', query = {}, data = {}) {
    super();

    // Set request info
    this._headers = {};
    this.method = method;
    this.protocol = Kinvey.apiProtocol;
    this.hostname = Kinvey.apiHostname;
    this.path = path;
    this.query = query instanceof Query ? query.toJSON() : query;
    this.data = data;
    this.authType = AuthType.None;

    // Add default headers
    let headers = {};
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
    headers['X-Kinvey-Api-Version'] = Kinvey.apiVersion;
    this.addHeaders(headers);
  }

  get cacheKey() {
    // Return a string that uniquely represents this request
    return `${JSON.stringify(this.toJSON())}`;
  }

  get headers() {
    return utils.clone(this._headers);
  }

  set headers(headers) {
    this._headers = utils.clone(headers);
  }

  get url() {
    return url.format({
      protocol: this.protocol,
      hostname: this.hostname,
      pathname: this.path,
      query: this.query,
      hash: this.hash
    });
  }

  getHeader(header) {
    let keys = Object.keys(this._headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];

      if (key.toLowerCase() === header.toLowerCase()) {
        return this._headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
    let headers = this._headers || {};
    headers[header] = value;
    this._headers = headers;
  }

  addHeaders(headers) {
    let keys = Object.keys(headers);

    keys.forEach((header) => {
      let value = headers[header];
      this.setHeader(header, value);
    });
  }

  clearCache() {
    // Create a cache request
    let cacheRequest = new CacheRequest(HttpMethod.DELETE, this.path, this.query, this.data);
    cacheRequest.authType = this.authType;
    cacheRequest.headers = this.headers;

    // Execute the cache request
    return cacheRequest.execute();
  }

  cacheResponse() {
    // Create a cache request
    let cacheRequest = new CacheRequest(HttpMethod.POST, this.path, this.query, this.data);
    cacheRequest.authType = this.authType;
    cacheRequest.headers = this.headers;

    // Execute the cache request
    return cacheRequest.execute();
  }

  getCachedResponse() {
     // Create a cache request
    let cacheRequest = new CacheRequest(HttpMethod.GET, this.path, this.query, this.data);
    cacheRequest.authType = this.authType;
    cacheRequest.headers = this.headers;

    // Execute the cache request
    return cacheRequest.execute();
  }

  execute(options = {}) {
    const auth = this.authType;
    const networkRack = Rack.networkRack();
    let promise = Promise.resolve();

    return promise.then(() => {
      if (utils.isDefined(auth)) {
        promise = utils.isFunction(auth) ? auth() : Promise.resolve(auth);

        // Add auth info to headers
        promise = promise.then((authInfo) => {
          if (auth !== null) {
            // Format credentials
            let credentials = authInfo.credentials;
            if (utils.isDefined(authInfo.username)) {
              credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
            }

            // Set the header
            this.setHeader('Authorization', `${auth.scheme} ${credentials}`);
          }
        });
      }
    }).then(() => {
      // Execute the request
      networkRack.execute(this);
    }).then((response) => {
      if (options.cache) {
        return this.cacheResponse().then(() => {
          return response;
        });
      }

      return response;
    });
  }

  toJSON() {
    // Create an object representing the request
    let json = {
      headers: utils.clone(this.headers),
      method: this.method,
      url: this.url,
      data: utils.clone(this.data)
    };

    // Return the json object
    return json;
  }
}

export default Request;
