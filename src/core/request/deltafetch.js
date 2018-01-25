import  Promise from 'es6-promise';
import  keyBy from 'lodash/keyBy';
import  reduce from 'lodash/reduce';
import  result from 'lodash/result';
import  values from 'lodash/values';
import  forEach from 'lodash/forEach';
import  isArray from 'lodash/isArray';
import  isString from 'lodash/isString';
import  { KinveyError, NotFoundError } from '../errors';
import  { isDefined } from '../utils';
import  { Query } from '../query';
import  { RequestMethod } from './request';
import  { KinveyRequest } from './network';
import  { CacheRequest } from './cache';
import  { Response, StatusCode } from './response';

const maxIdsPerRequest = 200;

export class DeltaFetchRequest extends KinveyRequest {
  constructor(options = {}) {
    super(options);
    this.tag = options.tag;
  }

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
        throw new KinveyError('Invalid request Method. Only RequestMethod.GET is allowed.');
    }
  }

  execute() {
    const request = new CacheRequest({
      method: RequestMethod.GET,
      url: this.url,
      headers: this.headers,
      query: this.query,
      timeout: this.timeout,
      client: this.client,
      tag: this.tag
    });
    return request.execute()
      .then(response => response.data)
      .catch((error) => {
        if (!(error instanceof NotFoundError)) {
          throw error;
        }

        return [];
      })
      .then((cacheData) => {
        if (isArray(cacheData) && cacheData.length > 0) {
          const cacheDocuments = keyBy(cacheData, '_id');
          const query = new Query(result(this.query, 'toJSON', this.query));
          query.fields = ['_id', '_kmd.lmt'];
          const request = new KinveyRequest({
            method: RequestMethod.GET,
            url: this.url,
            headers: this.headers,
            authType: this.authType,
            query: query,
            timeout: this.timeout,
            client: this.client,
            properties: this.properties,
            skipBL: this.skipBL,
            trace: this.trace,
            followRedirect: this.followRedirect,
            cache: this.cache
          });

          return request.execute()
            .then(response => response.data)
            .then((networkData) => {
              const networkDocuments = keyBy(networkData, '_id');
              const deltaSet = networkDocuments;
              const cacheDocumentIds = Object.keys(cacheDocuments);

              forEach(cacheDocumentIds, (id) => {
                const cacheDocument = cacheDocuments[id];
                const networkDocument = networkDocuments[id];

                if (networkDocument) {
                  if (isDefined(networkDocument._kmd) && isDefined(cacheDocument._kmd)
                      && networkDocument._kmd.lmt === cacheDocument._kmd.lmt) {
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
                query.contains('_id', ids);

                const request = new KinveyRequest({
                  method: RequestMethod.GET,
                  url: this.url,
                  headers: this.headers,
                  authType: this.authType,
                  query: query,
                  timeout: this.timeout,
                  client: this.client,
                  properties: this.properties,
                  skipBL: this.skipBL,
                  trace: this.trace,
                  followRedirect: this.followRedirect,
                  cache: this.cache
                });

                const promise = request.execute();
                promises.push(promise);
                i += maxIdsPerRequest;
              }

              return Promise.all(promises);
            })
            .then((responses) => {
              const response = reduce(responses, (result, response) => {
                if (response.isSuccess()) {
                  const headers = result.headers;
                  headers.addAll(response.headers);
                  result.headers = headers;
                  result.data = result.data.concat(response.data);
                }

                return result;
              }, new Response({
                statusCode: StatusCode.Ok,
                data: []
              }));

              response.data = response.data.concat(values(cacheDocuments));

              if (this.query) {
                const query = new Query(result(this.query, 'toJSON', this.query));
                query.skip = 0;
                query.limit = 0;
                response.data = query.process(response.data);
              }

              return response;
            });
        }

        const request = new KinveyRequest({
          method: RequestMethod.GET,
          url: this.url,
          headers: this.headers,
          authType: this.authType,
          query: this.query,
          timeout: this.timeout,
          client: this.client,
          properties: this.properties,
          skipBL: this.skipBL,
          trace: this.trace,
          followRedirect: this.followRedirect,
          cache: this.cache
        });
        return request.execute();
      });
  }
}
