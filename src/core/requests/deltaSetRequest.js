import Request from './request';
import Response from './response';
import { HttpMethod, StatusCode } from '../enums';
import { NotFoundError } from '../errors';
import Query from '../query';
import LocalRequest from './localRequest';
import NetworkRequest from './networkRequest';
import indexBy from 'lodash/collection/indexBy';
import reduce from 'lodash/collection/reduce';
import result from 'lodash/object/result';
import values from 'lodash/object/values';
import isEmpty from 'lodash/lang/isEmpty';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const lmtAttribute = process.env.KINVEY_LMT_ATTRIBUTE || 'lmt';
const maxIdsPerRequest = process.env.KINVEY_MAX_IDS || 200;

export default class DeltaSetRequest extends Request {
  execute() {
    const promise = super.execute().then(() => {
      if (this.method !== HttpMethod.GET) {
        throw new Error('Invalid http method. Http GET requests are only supported by DeltaSetRequest.');
      }

      const localRequest = new LocalRequest({
        method: HttpMethod.GET,
        client: this.client,
        headers: this.headers,
        auth: this.auth,
        pathname: this.pathname,
        query: this.query,
        timeout: this.timeout
      });
      return localRequest.execute();
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return new Response({
          statusCode: StatusCode.Ok,
          data: []
        });
      }

      throw err;
    }).then(cacheResponse => {
      if (cacheResponse && cacheResponse.isSuccess()) {
        const cacheDocuments = indexBy(cacheResponse.data, idAttribute);
        const query = new Query(result(this.query, 'toJSON', this.query));
        query.fields([idAttribute, kmdAttribute]);
        const networkRequest = new NetworkRequest({
          method: HttpMethod.GET,
          client: this.client,
          headers: this.headers,
          auth: this.auth,
          pathname: this.pathname,
          query: query,
          timeout: this.timeout
        });

        return networkRequest.execute().then(networkResponse => {
          if (networkResponse && networkResponse.isSuccess()) {
            const networkDocuments = indexBy(networkResponse.data, idAttribute);
            const deltaSet = networkDocuments;

            for (const id in cacheDocuments) {
              if (cacheDocuments.hasOwnProperty(id)) {
                const cacheDocument = cacheDocuments[id];
                const networkDocument = networkDocuments[id];

                if (networkDocument) {
                  if (networkDocument[kmdAttribute] && cacheDocument[kmdAttribute]
                      && networkDocument[kmdAttribute][lmtAttribute] === cacheDocument[kmdAttribute][lmtAttribute]) {
                    delete deltaSet[id];
                  } else {
                    delete cacheDocuments[id];
                  }
                } else {
                  delete cacheDocuments[id];
                }
              }
            }

            const deltaSetIds = Object.keys(deltaSet);
            const promises = [];
            let i = 0;

            while (i < deltaSetIds.length) {
              const query = new Query();
              const ids = deltaSetIds.slice(i, deltaSetIds.length > maxIdsPerRequest + i ?
                                               maxIdsPerRequest : deltaSetIds.length);
              query.contains(idAttribute, ids);
              const networkRequest = new NetworkRequest({
                method: HttpMethod.GET,
                client: this.client,
                headers: this.headers,
                auth: this.auth,
                pathname: this.pathname,
                query: query,
                timeout: this.timeout
              });
              promises.push(networkRequest.execute());
              i += maxIdsPerRequest;
            }

            return Promise.all(promises).then(responses => {
              const initialResponse = new Response({
                statusCode: StatusCode.Ok,
                data: []
              });
              return reduce(responses, (result, response) => {
                if (response && response.isSuccess()) {
                  result.addHeaders(response.headers);
                  result.data = result.data.concat(response.data);
                }

                return result;
              }, initialResponse);
            }).then(response => {
              if (!isEmpty(response.data)) {
                const updateCacheRequest = new LocalRequest({
                  method: HttpMethod.PUT,
                  client: this.client,
                  headers: this.headers,
                  auth: this.auth,
                  pathname: this.pathname,
                  data: response.data,
                  timeout: this.timeout
                });
                return updateCacheRequest.execute().then(() => {
                  return response;
                });
              }

              return response;
            }).then(response => {
              response.data = response.data.concat(values(cacheDocuments));

              if (this.query) {
                const query = new Query(result(this.query, 'toJSON', this.query));
                query.skip(0).limit(0);
                response.data = query._process(response.data);
              }

              return response;
            });
          }

          return networkResponse;
        });
      }

      return cacheResponse;
    });

    return promise;
  }
}
