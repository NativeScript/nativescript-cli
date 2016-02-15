import CacheStore from './cacheStore';
import LocalRequest from '../requests/localRequest';
import { HttpMethod } from '../enums';
import { KinveyError } from '../errors';
import Query from '../query';
import Auth from '../auth';
import assign from 'lodash/assign';
import log from '../log';

export default class SyncStore extends CacheStore {

  /**
   * Finds all entities in a collection. A query can be optionally provided to return
   * a subset of all entities in a collection or omitted to return all entities in
   * a collection. The number of entities returned will adhere to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
   * promise will be returned that will be resolved with the entities or rejected with
   * an error.
   *
   * @param   {Query}                 [query]                                   Query used to filter result.
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = new Kinvey.SyncStore('books');
   * var query = new Query();
   * query.equalTo('author', 'Kinvey');
   * store.find(query).then(function(books) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  find(query, options = {}) {
    log.debug(`Retrieving the entities in the ${this.name} collection.`, query);

    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: this.client.getUrl(this._pathname),
        properties: options.properties,
        auth: Auth.default,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Retrieved the entities in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to retrieve the entities in the ${this.name} collection.`, err);
    });

    return promise;
  }
}
