import { Request } from './request';
import { KinveyRackManager } from '../../rack/rack';
import { NoResponseError } from '../../errors';
import { Response } from './response';
import UrlPattern from 'url-pattern';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import assign from 'lodash/assign';
import url from 'url';


/**
 * @private
 */
export class CacheRequest extends Request {
  constructor(options) {
    super(options);

    // Set default options
    options = assign({
      query: null
    }, options);

    this.query = options.query;
    this.rack = KinveyRackManager.cacheRack;
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
    await super.execute();
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
}
