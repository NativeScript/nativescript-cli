/* eslint-disable no-underscore-dangle */
import { KinveyRequest, RequestMethod } from './request';
import CacheRequest from './cache';
import { NetworkRequest } from './network';
import { KinveyResponse, KinveyResponseConfig, StatusCode } from './response';
import { NotFoundError } from '../errors';
import { Query } from '../query';
import keyBy from 'lodash/keyBy';
import reduce from 'lodash/reduce';
import result from 'lodash/result';
import values from 'lodash/values';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const maxIdsPerRequest = 200;

/**
 * @private
 */
export class DeltaFetchRequest extends KinveyRequest {
  get method() {
    return super.method;
  }

  set method(method) {
    // Cast the method to a string
    if (!isString(method)) {
      method = String(method);
    }

    // Make sure the the method is upper case
    method = method.toUpperCase();

    // Verify that the method is allowed
    switch (method) {
      case RequestMethod.GET:
        super.method = method;
        break;
      case RequestMethod.POST:
      case RequestMethod.PATCH:
      case RequestMethod.PUT:
      case RequestMethod.DELETE:
      default:
        throw new Error('Invalid request Method. Only RequestMethod.GET is allowed.');
    }
  }

  async execute() {
    let cacheData = [];
    await super.execute();

    try {
      const request = new CacheRequest({
        method: RequestMethod.GET,
        url: this.url,
        headers: this.headers,
        query: this.query,
        timeout: this.timeout,
        client: this.client
      });
      cacheData = await request.execute().then(cacheResponse => cacheResponse.data);
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }

      cacheData = [];
    }

    if (isArray(cacheData) && cacheData.length > 0) {
      const cacheDocuments = keyBy(cacheData, idAttribute);
      const query = new Query(result(this.query, 'toJSON', this.query));
      query.fields = [idAttribute, `${kmdAttribute}.lmt`];
      const networkRequest = new NetworkRequest({
        method: RequestMethod.GET,
        url: this.url,
        headers: this.headers,
        auth: this.auth,
        query: query,
        timeout: this.timeout,
        client: this.client
      });

      const networkData = await networkRequest.execute().then(response => response.data);
      const networkDocuments = keyBy(networkData, idAttribute);
      const deltaSet = networkDocuments;
      const cacheDocumentIds = Object.keys(cacheDocuments);

      forEach(cacheDocumentIds, id => {
        const cacheDocument = cacheDocuments[id];
        const networkDocument = networkDocuments[id];

        if (networkDocument) {
          if (networkDocument[kmdAttribute] && cacheDocument[kmdAttribute]
              && networkDocument[kmdAttribute].lmt === cacheDocument[kmdAttribute].lmt) {
            delete deltaSet[id];
          } else {
            delete cacheDocuments[id];
          }
        } else {
          delete cacheDocuments[id];
        }
      });

      const deltaSetIds = Object.keys(deltaSet);
      const promises = [];
      let i = 0;

      while (i < deltaSetIds.length) {
        const query = new Query(result(this.query, 'toJSON', this.query));
        const ids = deltaSetIds.slice(i, deltaSetIds.length > maxIdsPerRequest + i ?
                                         maxIdsPerRequest : deltaSetIds.length);
        query.contains(idAttribute, ids);
        const networkRequest = new NetworkRequest({
          method: RequestMethod.GET,
          url: this.url,
          headers: this.headers,
          auth: this.auth,
          query: query,
          timeout: this.timeout,
          client: this.client
        });

        const promise = networkRequest.execute();
        promises.push(promise);
        i += maxIdsPerRequest;
      }

      const responses = await Promise.all(promises);
      const response = reduce(responses, (result, response) => {
        if (response.isSuccess()) {
          const headers = result.headers;
          headers.addHeaders(response.headers);
          result.headers = headers;
          result.data = result.data.concat(response.data);
        }

        return result;
      }, new KinveyResponse(new KinveyResponseConfig({
        statusCode: StatusCode.Ok,
        data: []
      })));

      response.data = response.data.concat(values(cacheDocuments));

      if (this.query) {
        const query = new Query(result(this.query, 'toJSON', this.query));
        query.skip(0).limit(0);
        response.data = query._process(response.data);
      }

      return response;
    }

    const networkRequest = new NetworkRequest({
      method: RequestMethod.GET,
      url: this.url,
      headers: this.headers,
      auth: this.auth,
      query: this.query,
      timeout: this.timeout,
      client: this.client
    });
    return networkRequest.execute();
  }
}
