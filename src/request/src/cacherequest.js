import Request from './request';
import KinveyResponse from './kinveyresponse';
import { KinveyError } from '../../errors';
import { Client } from '../../client';
import { CacheRack } from 'kinvey-javascript-rack';
import UrlPattern from 'url-pattern';
import url from 'url';

/**
 * @private
 */
export default class CacheRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.query = options.query;
    this.client = options.client;
    this.rack = new CacheRack();
  }

  get url() {
    return super.url;
  }

  set url(urlString) {
    super.url = urlString;
    const pathname = global.escape(url.parse(urlString).pathname);
    const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');
    const { appKey, collection, entityId } = pattern.match(pathname) || {};
    this.appKey = appKey;
    this.collection = collection;
    this.entityId = entityId;
  }

  get client() {
    return this._client || Client.sharedInstance();
  }

  set client(client) {
    if (client) {
      if (!(client instanceof Client)) {
        throw new KinveyError('client must be an instance of the Client class.');
      }
    }

    this._client = client;
  }

  execute() {
    return super.execute().then((response) => {
      if (!(response instanceof KinveyResponse)) {
        response = new KinveyResponse({
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

      // If a query was provided then process the data with the query
      if (this.query) {
        response.data = this.query.process(response.data);
      }

      // Just return the response
      return response;
    });
  }

  cancel() {
    return this.rack.cancel();
  }

  toPlainObject() {
    const obj = super.toPlainObject();
    obj.appKey = this.appKey;
    obj.collection = this.collection;
    obj.entityId = this.entityId;
    obj.encryptionKey = this.client ? this.client.encryptionKey : undefined;
    return obj;
  }
}
