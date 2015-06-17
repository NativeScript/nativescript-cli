import CoreObject from './object';
import HttpMethod from '../enums/httpMethod';
import utils from './utils';
import Kinvey from '../kinvey';
import url from 'url';
import Query from './query';

class Request extends CoreObject {
  constructor(method = HttpMethod.GET, path = '', query = {}, body = {}) {
    super();

    // Set request info
    this._headers = {};
    this.method = method;
    this.protocol = Kinvey.apiProtocol;
    this.hostname = Kinvey.apiHostname;
    this.path = path;
    this.query = query instanceof Query ? query.toJSON() : query;
    this.body = body;

    // Add default headers
    let headers = {};
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
    // headers['X-Kinvey-Api-Version'] = Kinvey.apiVersion;
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

  execute() {
    return Promise.reject(new Error('Subclass must override this method'));
  }

  toJSON() {
    // Create an object representing the request
    let json = {
      headers: this.headers,
      method: this.method,
      url: this.url,
      body: this.body
    };

    // Return the json object
    return json;
  }
}

export default Request;
