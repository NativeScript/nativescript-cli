import url from 'url';

import { CacheRequest, RequestMethod } from '../request';
import { KinveyError } from '../errors';
import { Query } from '../query';
import { Aggregation } from '../aggregation';
import { isDefined } from '../utils';
import { KinveyObservable, wrapInObservable } from '../observable';
import { CacheStore } from './cachestore';

import { OperationType } from './operations';
import { processorFactory } from './processors';

// TODO: refactor all datastores

/**
 * The SyncStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */
export class SyncStore extends CacheStore {
  constructor(collection, options = {}, processor) {
    const proc = processor || processorFactory.getOfflineProcessor();
    super(collection, options, proc);
  }

  /**
   * Find all entities in the data store. A query can be optionally provided to return
   * a subset of all entities in a collection or omitted to return all entities in
   * a collection. The number of entities returned adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                             Query used to filter entities.
   * @param   {Object}                [options]                           Options
   * @param   {Properties}            [options.properties]                Custom properties to send with
   *                                                                      the request.
   * @param   {Number}                [options.timeout]                   Timeout for the request.
   * @param   {Boolean}               [options.useDeltaFetch]             Turn on or off the use of delta fetch.
   * @return  {Observable}                                                Observable.
   */
  find(query, options = {}) {
    // TODO: wrap in observable elsewhere
    const stream = KinveyObservable.create((observer) => {
      // Check that the query is valid
      if (isDefined(query) && !(query instanceof Query)) {
        const err = new KinveyError('Invalid query. It must be an instance of the Query class.');
        return observer.error(err);
      }

      const operation = this._buildOperationObject(OperationType.Read, query);
      return this._executeOperation(operation, options)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream;
  }

  create(entity, options) {
    const operation = this._buildOperationObject(OperationType.Create, null, entity);
    return this._executeOperation(operation, options);
  }

  update(entity, options) {
    const operation = this._buildOperationObject(OperationType.Update, null, entity);
    return this._executeOperation(operation, options);
  }

  get syncAutomatically() {
    return false;
  }

  /**
   * Find a single entity in the data store by id.
   *
   * @param   {string}                id                               Entity by id to find.
   * @param   {Object}                [options]                        Options
   * @param   {Properties}            [options.properties]             Custom properties to send with
   *                                                                   the request.
   * @param   {Number}                [options.timeout]                Timeout for the request.
   * @param   {Boolean}               [options.useDeltaFetch]          Turn on or off the use of delta fetch.
   * @return  {Observable}                                             Observable.
   */
  findById(id, options = {}) {
    if (!id) { // really?
      return wrapInObservable((observer) => {
        observer.next();
        observer.complete();
      });
    }
    return wrapInObservable((observer) => {
      const operation = this._buildOperationObject(OperationType.ReadById, null, null, id);
      return this._executeOperation(operation, options)
        .then(res => observer.next(res));
    });
  }

  /**
   * Group entities.
   *
   * @param   {Aggregation}           aggregation                         Aggregation used to group entities.
   * @param   {Object}                [options]                           Options
   * @param   {Properties}            [options.properties]                Custom properties to send with
   *                                                                      the request.
   * @param   {Number}                [options.timeout]                   Timeout for the request.
   * @return  {Observable}                                                Observable.
   */
  group(aggregation, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      // Check that the aggregation is valid
      if (!(aggregation instanceof Aggregation)) {
        return observer.error(new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.'));
      }

      // Fetch the cache entities
      const request = new CacheRequest({
        method: RequestMethod.POST,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `${this.pathname}/_group`
        }),
        properties: options.properties,
        aggregation: aggregation,
        timeout: options.timeout
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .then(result => observer.next(result))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
    return stream;
  }

  /**
   * Count all entities in the data store. A query can be optionally provided to return
   * a subset of all entities in a collection or omitted to return all entities in
   * a collection. The number of entities returned adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                          Query used to filter entities.
   * @param   {Object}                [options]                        Options
   * @param   {Properties}            [options.properties]             Custom properties to send with
   *                                                                   the request.
   * @param   {Number}                [options.timeout]                Timeout for the request.
   * @return  {Observable}                                             Observable.
   */
  count(query, options = {}) {
    const err = this._ensureValidQuery(query);
    if (err) {
      return err;
    }

    return wrapInObservable((observer) => {
      const operation = this._buildOperationObject(OperationType.Count, query, null, null);
      return this._executeOperation(operation, options)
        .then(res => observer.next(res));
    });
  }
}
