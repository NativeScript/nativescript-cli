import { Request } from './request';
import { NoResponseError, KinveyError } from '../../errors';
import { Response } from './response';
import { Client } from '../../client';
import { CacheRack } from 'kinvey-cache-rack'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import UrlPattern from 'url-pattern';
import url from 'url';
import assign from 'lodash/assign';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

/**
 * @private
 */
export class CacheRequest extends Request {
  constructor(options = {}) {
    super(options);

    // Set default options
    options = assign({
      query: null,
      client: Client.sharedInstance()
    }, options);

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
    return this._client;
  }

  set client(client) {
    if (client) {
      if (!(client instanceof Client)) {
        throw new KinveyError('client must be an instance of the Client class.');
      }
    }

    this._client = client;
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

    // If a query was provided then process the data with the query
    if (this.query) {
      response.data = this.query.process(response.data);
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
    obj.appKey = this.appKey;
    obj.collection = this.collection;
    obj.entityId = this.entityId;
    obj.encryptionKey = this.client ? this.client.encryptionKey : undefined;
    return obj;
  }
}
