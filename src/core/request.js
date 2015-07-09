import CoreObject from './object';
import utils from './utils';
import HttpMethod from '../enums/httpMethod';
import Rack from './rack';
import AuthType from '../enums/authType';
import Auth from './auth';
import CachePolicy from '../enums/cachePolicy';
import url from 'url';
import Query from './query';
import Kinvey from '../kinvey';

class Request extends CoreObject {
  constructor(method = HttpMethod.GET, path = '', query = {}, body = {}) {
    super();

    let kinvey = Kinvey.instance();

    // Set request info
    this.method = method;
    this.protocol = kinvey.apiProtocol;
    this.hostname = kinvey.apiHostname;
    this.path = path;
    this.query = query instanceof Query ? query.toJSON() : query;
    this.body = body;
    this.authType = AuthType.None;
    this.cachePolicy = CachePolicy.NetworkFirst;

    // Add default headers
    let headers = {};
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
    headers['X-Kinvey-Api-Version'] = kinvey.apiVersion;
    this.addHeaders(headers);
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

  set authType(authType) {
    switch (authType) {
      case AuthType.All:
        this._auth = Auth.all;
        break;
      case AuthType.App:
        this._auth = Auth.app;
        break;
      case AuthType.Basic:
        this._auth = Auth.basic;
        break;
      case AuthType.Master:
        this._auth = Auth.master;
        break;
      case AuthType.None:
        this._auth = Auth.none;
        break;
      case AuthType.Session:
        this._auth = Auth.session;
        break;
      default:
        this._auth = Auth.default;
        break;
    }
  }

  get cacheKey() {
    if (!utils.isDefined(this._cacheKey)) {
      this.cacheKey = JSON.stringify(this.toJSON());
    }

    return this._cacheKey;
  }

  set cacheKey(cacheKey) {
    this._cacheKey = cacheKey;
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

  execute(options = {}) {
    const auth = this._auth;
    const networkRack = Rack.networkRack;
    const cacheRack = Rack.cacheRack;
    const cachePolicy = options.cachePolicy || this.cachePolicy;
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
      if (cachePolicy === CachePolicy.CacheOnly) {
        return cacheRack.execute(this);
      } else if (cachePolicy === CachePolicy.NetworkFirst) {
        return networkRack.execute(this).catch(() => {
          // TO DO: Check error
          cacheRack.execute(this);
        });
      } else if (cachePolicy === CachePolicy.CacheFirst) {
        return cacheRack.execute(this).catch(() => {
          // TO DO: Check error
          networkRack.execute(this);
        });
      }

      return networkRack.execute(this);
    }).then((response) => {
      // Set the response
      this.response = response;

      // Cache the response
      if (this.method === HttpMethod.GET && cachePolicy !== CachePolicy.NetworkOnly) {
        const originalMethod = this.method;
        this.method = HttpMethod.POST;

        return cacheRack.execute(this).then(() => {
          this.method = originalMethod;
          return response;
        });
      }

      // Return the response
      return response;
    });
  }

  toJSON() {
    // Create an object representing the request
    let json = {
      headers: this.headers,
      method: this.method,
      url: this.url,
      body: this.body,
      data: this.body
    };

    // Return the json object
    return json;
  }
}

export default Request;
