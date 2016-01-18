const Request = require('./request');
const Response = require('./response');
const HttpMethod = require('../enums').HttpMethod;
const StatusCode = require('../enums').StatusCode;
const NotFoundError = require('../errors').NotFoundError;
import Query from '../query';
const LocalRequest = require('./localRequest');
const NetworkRequest = require('./networkRequest');
const indexBy = require('lodash/collection/indexBy');
const reduce = require('lodash/collection/reduce');
const result = require('lodash/object/result');
const values = require('lodash/object/values');
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const lmtAttribute = process.env.KINVEY_LMT_ATTRIBUTE || 'lmt';
const maxIdsPerRequest = process.env.KINVEY_MAX_IDS || 200;

class DeltaSetRequest extends Request {
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
        const deltaSetQuery = new Query(result(this.query, 'toJSON', this.query));
        deltaSetQuery.fields([idAttribute, kmdAttribute]);
        const networkRequest = new NetworkRequest({
          method: HttpMethod.GET,
          client: this.client,
          headers: this.headers,
          auth: this.auth,
          pathname: this.pathname,
          query: deltaSetQuery,
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
              const query = new Query(result(this.query, 'toJSON', this.query));
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
                data: values(cacheDocuments)
              });
              return reduce(responses, (result, response) => {
                if (response && response.isSuccess()) {
                  result.addHeaders(response.headers);
                  result.data = result.data.concat(response.data);
                }

                return result;
              }, initialResponse);
            }).then(response => {
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
            }).then(response => {
              if (this.query) {
                response.data = this.query._process(response.data);
                return response;
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

module.exports = DeltaSetRequest;
