import url from  'url';
import cloneDeep from  'lodash/cloneDeep';
import { KinveyError } from  '../errors';
import { Query } from  '../query';
import { Aggregation } from  '../aggregation';
import { isDefined } from  '../utils';
import { Request } from  './request';
import { KinveyResponse } from  './response';
import { CacheRack } from  './rack';

export class CacheRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.aggregation = options.aggregation;
    this.query = options.query;
    this.rack = CacheRack;
    this.tag = options.tag;
  }

  get body() {
    return this._body;
  }

  set body(body) {
    this._body = cloneDeep(body);
  }

  get query() {
    return this._query;
  }

  set query(query) {
    if (isDefined(query) && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    this._query = query;
  }

  get aggregation() {
    return this._aggregation;
  }

  set aggregation(aggregation) {
    if (isDefined(aggregation) && !(aggregation instanceof Aggregation)) {
      throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
    }

    this._aggregation = aggregation;
  }

  get collection() {
    if (isDefined(this.tag)) {
      return  `${this._collection}.${this.tag}`;
    }

    return this._collection;
  }

  set collection(collection) {
    this._collection = collection;
  }

  get url() {
    return super.url;
  }

  set url(urlString) {
    super.url = urlString;
    const pathname = global.decodeURIComponent(url.parse(urlString).pathname);
    const urlParts = pathname.replace(/^\//, '').split('/');
    // "pathname" has the following form: "/namespace/appKey/collection/id"
    this.appKey = urlParts[1];
    this.collection = urlParts[2];
    this.entityId = urlParts[3];
  }

  execute() {
    return super.execute()
      .then((response) => {
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
        if (isDefined(this.query) && isDefined(response.data)) {
          response.data = this.query.process(response.data);
        }

        // If an aggregation was provided then process the data with the aggregation
        if (isDefined(this.aggregation) && isDefined(response.data)) {
          response.data = this.aggregation.process(response.data);
        }

        // Just return the response
        return response;
      });
  }

  toPlainObject() {
    const obj = super.toPlainObject();
    obj.appKey = this.appKey;
    obj.collection = this.collection;
    obj.entityId = this.entityId;
    obj.encryptionKey = this.client ? this.client.encryptionKey : undefined;
    obj.storageProviders = this.client ? this.client.storageProviders : undefined;
    return obj;
  }
}
