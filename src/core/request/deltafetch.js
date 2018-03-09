import assign from 'lodash/assign';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import url from 'url';
import urljoin from 'url-join';
import { KinveyError } from '../errors';
import { Query } from '../query';
import { RequestMethod } from './request';
import { KinveyRequest, AuthType } from './network';
import { repositoryProvider } from '../datastore/repositories';
import { Client } from '../client';

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
        const queryCacheQuery = new Query()
          .equalTo('collectionName', collectionName)
          .equalTo('query', this.query ? this.query.toQueryString().query : undefined)
          .descending('lastRequest');
        return repo.read(QUERY_CACHE_COLLECTION_NAME, queryCacheQuery)
          .then((queries) => {
            let deltaSetQuery = {
              collectionName: this._getCollectionFromUrl(),
              query: this.query ? this.query.toQueryString().query : undefined
            };
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
              [deltaSetQuery] = queries;
              request.url = urljoin(this.url.split('?')[0], url.format({
                pathname: '_deltaset',
                query: { since: deltaSetQuery.lastRequest }
              }), `?${this.url.split('?')[1] || ''}`);
            }

            return request.execute()
              .then((response) => {
                deltaSetQuery.lastRequest = response.headers.get('X-Kinvey-Request-Start');
                return repo.update(QUERY_CACHE_COLLECTION_NAME, deltaSetQuery).then(() => response);
              });
          })
          .then((response) => {
            // Makse sure the response from DeltaSet is normalized
            const { data } = response;

            if (!data.changed) {
              data.changed = data;
            }

            if (!data.deleted) {
              data.deleted = [];
            }

            response.data = data;
            return response;
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

  static execute(options, client, dataOnly = true) {
    const o = assign({
      method: RequestMethod.GET,
      authType: AuthType.Session
    }, options);
    client = client || Client.sharedInstance();

    if (!o.url && isString(o.pathname) && client) {
      o.url = url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: o.pathname
      });
    }

    let prm = new DeltaFetchRequest(o).execute();
    if (dataOnly) {
      prm = prm.then(r => r.data);
    }
    return prm;
  }
}
