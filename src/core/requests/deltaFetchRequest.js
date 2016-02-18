import Request from './request';
import Response from './response';
import { HttpMethod, StatusCode } from '../enums';
import { NotFoundError } from '../errors';
import Query from '../query';
import LocalRequest from './localRequest';
import NetworkRequest from './networkRequest';
import keyBy from 'lodash/keyBy';
import reduce from 'lodash/reduce';
import result from 'lodash/result';
import values from 'lodash/values';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const lmtAttribute = process.env.KINVEY_LMT_ATTRIBUTE || 'lmt';
const maxIdsPerRequest = process.env.KINVEY_MAX_IDS || 200;

/**
 * @private
 */
export default class DeltaFetchRequest extends Request {
  execute() {
    const promise = super.execute().then(() => {
      if (this.method !== HttpMethod.GET) {
        throw new Error('Invalid http method. Http GET requests are only supported by DeltaFetchRequests.');
      }

      const localRequest = new LocalRequest({
        method: HttpMethod.GET,
        url: this.url,
        headers: this.headers,
        auth: this.auth,
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
      const cacheDocuments = keyBy(cacheResponse.data, idAttribute);
      const query = new Query(result(this.query, 'toJSON', this.query));
      query.fields([idAttribute, kmdAttribute]);
      const networkRequest = new NetworkRequest({
        method: HttpMethod.GET,
        url: this.url,
        headers: this.headers,
        auth: this.auth,
        query: query,
        timeout: this.timeout
      });

      return networkRequest.execute().then(networkResponse => {
        const networkDocuments = keyBy(networkResponse.data, idAttribute);
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
            url: this.url,
            headers: this.headers,
            auth: this.auth,
            query: query,
            timeout: this.timeout
          });

          const promise = networkRequest.execute().catch(() => {
            return new Response({
              statusCode: StatusCode.ServerError
            });
          });
          promises.push(promise);

          i += maxIdsPerRequest;
        }

        return Promise.all(promises).then(responses => {
          const initialResponse = new Response({
            statusCode: StatusCode.Ok,
            data: []
          });
          return reduce(responses, (result, response) => {
            if (response.isSuccess()) {
              result.addHeaders(response.headers);
              result.data = result.data.concat(response.data);
            }

            return result;
          }, initialResponse);
        }).then(response => {
          response.data = response.data.concat(values(cacheDocuments));

          if (this.query) {
            const query = new Query(result(this.query, 'toJSON', this.query));
            query.skip(0).limit(0);
            response.data = query._process(response.data);
          }

          return response;
        });
      });
    });

    return promise;
  }
}
