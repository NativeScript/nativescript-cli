import { Request } from './request';
import { NoResponseError, KinveyError } from '../../errors';
import { Response } from './response';
import { Rack } from 'kinvey-javascript-rack/dist/rack';
import UrlPattern from 'url-pattern';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';

/**
 * @private
 */
export class CacheRequest extends Request {
  constructor(options) {
    super(options);
    this.query = options.query;
    this.rack = CacheRequest.rack;
  }

  static get rack() {
    return CacheRequest._rack;
  }

  static set rack(rack) {
    if (!rack || !(rack instanceof Rack)) {
      throw new KinveyError('Unable to set the rack of a NetworkRequest. It must be an instance of a Rack');
    }

    CacheRequest._rack = rack;
  }

  get url() {
    return super.url;
  }

  set url(urlString) {
    super.url = urlString;
    const pathname = global.escape(url.parse(urlString).pathname);
    const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');
    const { appKey, collection, entityId } = pattern.match(pathname) || {};
    this.appKey = !!appKey ? global.unescape(appKey) : appKey;
    this.collection = !!collection ? global.unescape(collection) : collection;
    this.entityId = !!entityId ? global.unescape(entityId) : entityId;
  }

  async execute() {
    if (!this.rack) {
      throw new KinveyError('Unable to execute the request. Please provide a rack to execute the request.');
    }

    let response = await this.rack.execute(this);

    // Flip the executing flag to false
    this.executing = false;

    // Throw a NoResponseError if we did not receive
    // a response
    if (!response) {
      throw new NoResponseError();
    }

    // Make sure the response is an instance of the
    // Response class
    if (!(response instanceof Response)) {
      response = new Response({
        statusCode: response.statusCode,
        headers: response.headers,
        data: response.data
      });
    }

    // Throw the response error if we did not receive
    // a successfull response
    if (!response.isSuccess()) {
      throw response.error;
    }

    // Just return the response
    return response;
  }

  async cancel() {
    await super.cancel();
    return this.rack.cancel();
  }

  toPlainObject() {
    const obj = super.toPlainObject();
    obj.query = this.query;
    obj.appKey = this.appKey;
    obj.collection = this.collection;
    obj.entityId = this.entityId;
    return obj;
  }
}
