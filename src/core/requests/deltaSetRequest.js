const Request = require('./request');
const HttpMethod = require('../enums').HttpMethod;
const StatusCode = require('../enums').StatusCode;
const Query = require('../query');
const CacheRequest = require('./cacheRequest');
const NetworkRequest = require('./networkRequest');
const NetworkRack = require('../rack/networkRack');
const indexBy = require('lodash/collection/indexBy');
const reduce = require('lodash/collection/reduce');
const result = require('lodash/object/result');
const values = require('lodash/object/values');
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const maxIdsPerRequest = process.env.KINVEY_MAX_IDS || 200;

class DeltaSetRequest extends Request {
  execute() {
    const origQuery = this.query;

    const promise = super.execute().then(() => {
      if (this.method !== HttpMethod.GET) {
        throw new Error('Invalid http method. Http GET requests are only supported by DeltaSetRequest.');
      }

      const cacheRequest = new CacheRequest(this);
      return cacheRequest.execute();
    }).then(cacheResponse => {
      if (cacheResponse && cacheResponse.isSuccess()) {
        const cacheDocuments = indexBy(cacheResponse.data, idAttribute);
        const networkRack = NetworkRack.sharedInstance();
        const deltaSetQuery = new Query(result(origQuery, 'toJSON', origQuery));
        deltaSetQuery.fields([idAttribute, kmdAttribute]);
        this.query = deltaSetQuery;

        return networkRack.execute(this).then(networkResponse => {
          if (networkResponse && networkResponse.isSuccess()) {
            const networkDocuments = indexBy(networkResponse.data, idAttribute);

            // Remove all id's that have not changed
            for (const id in networkDocuments) {
              if (networkDocuments.hasOwnProperty(id)) {
                const networkDocument = networkDocuments[id];
                const cacheDocument = cacheDocuments[id];

                if (networkDocument && !cacheDocument) {
                  delete cacheDocuments[id];
                } else if (networkDocument && cacheDocument) {
                  if (networkDocument[kmdAttribute] && cacheDocument[kmdAttribute] &&
                      networkDocument[kmdAttribute].lmt > cacheDocument[kmdAttribute].lmt) {
                    delete cacheDocuments[id];
                  }
                } else {
                  delete networkDocuments[id];
                }
              }
            }

            const networkIds = Object.keys(networkDocuments);
            const promises = [];
            let i = 0;

            while (i < networkIds.length) {
              const query = new Query(result(origQuery, 'toJSON', origQuery));
              query.contains(idAttribute, networkIds.slice(i, networkIds.length > maxIdsPerRequest + i ?
                                                              maxIdsPerRequest : networkIds.length));
              this.query = query;
              const networkRequest = new NetworkRequest(this);
              promises.push(networkRequest.execute());
              i += maxIdsPerRequest;
            }

            return Promise.all(promises).then(responses => {
              const initialResponse = new Response(StatusCode.Ok, {}, values(cacheDocuments));
              return reduce(responses, (result, response) => {
                if (response.headers) {
                  result.addHeaders(response.headers);
                }

                result.data = result.data.concat(response.data);
                return result;
              }, initialResponse);
            }).finally(() => {
              this.query = origQuery;
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
