import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import url from 'url';
import urljoin from 'url-join';
import { KinveyError } from '../errors';
import { Query } from '../query';
import { RequestMethod } from './request';
import { KinveyRequest } from './network';
import { Response } from './response';
import { repositoryProvider } from '../datastore/repositories';

const QUERY_CACHE_COLLECTION_NAME = '_QueryCache';

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
        throw new KinveyError('Invalid request Method. Only RequestMethod.GET is allowed.');
    }
  }

  execute() {
    return repositoryProvider.getOfflineRepository()
      .then((repo) => {
        const collectionName = this._getCollectionFromUrl();
        let queryCacheQuery = new Query()
          .equalTo('collectionName', collectionName)
          .descending('lastRequest');

        if (this.query) {
          queryCacheQuery = queryCacheQuery
            .and()
            .equalTo('query', this.query.toString());
        }

        return repo.read(QUERY_CACHE_COLLECTION_NAME, queryCacheQuery)
          .then((queries) => {
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

            if (isArray(queries) && queries.length > 0) {
              const since = queries[0].lastRequest;
              request.url = urljoin(this.url, url.format({
                pathname: '_deltaset',
                query: { since }
              }));
              return request.execute();
            }

            return request.execute()
              .then((response) => {
                const deltaSetResponse = new Response(response);
                deltaSetResponse.headers = response.headers;
                deltaSetResponse.data = {
                  deleted: [],
                  changed: response.data
                };
                return deltaSetResponse;
              });
          })
          .then((response) => {
            return repo.create(QUERY_CACHE_COLLECTION_NAME, {
              collectionName: this._getCollectionFromUrl(),
              query: this.query ? this.query.toString() : null,
              lastRequest: response.headers.get('X-Kinvey-Request-Start')
            }).then(() => response);
          });
      });
  }

  _getCollectionFromUrl() {
    const appkeyStr = `appdata/${this.client.appKey}/`;
    const ind = this.url.indexOf(appkeyStr);
    let indOfQueryString = this.url.indexOf('?'); // shouldn't have anything past the collection, like an ID

    if (ind === -1) {
      throw new KinveyError('An unexpected error occured. Could not find collection');
    }

    if (indOfQueryString === -1) {
      indOfQueryString = Infinity;
    }

    return this.url.substring(ind + appkeyStr.length, indOfQueryString);
  }
}
