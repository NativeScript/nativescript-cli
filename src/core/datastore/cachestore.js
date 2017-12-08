import Promise from 'es6-promise';
import assign from 'lodash/assign';
import isArray from 'lodash/isArray';
import url from 'url';

import { CacheRequest, RequestMethod } from '../request';
import { KinveyError } from '../errors';
import { Query } from '../query';
import { Aggregation } from '../aggregation';
import { isDefined, isNonemptyString } from '../utils';
import { KinveyObservable, wrapInObservable } from '../observable';
import { NetworkStore } from './networkstore';

import { OperationType } from './operations';
import { processorFactory } from './processors';
import { syncManagerProvider } from './sync';

/**
 * The CacheStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */
export class CacheStore extends NetworkStore {
  constructor(collection, options = {}, processor) {
    const proc = processor || processorFactory.getCacheOfflineDataProcessor();
    super(collection, options, proc);

    /**
     * @type {number|undefined}
     */
    this.ttl = options.ttl || undefined;

    /**
     * @type {SyncManager}
     */
    this.syncManager = syncManagerProvider.getSyncManager();
  }

  get syncAutomatically() {
    return true;
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
    // return super.find(query, options);
    if (query && !(query instanceof Query)) {
      const err = new KinveyError('Invalid query. It must be an instance of the Query class.');
      return KinveyObservable.create((o) => {
        o.error(err);
        o.complete();
      });
    }

    const operation = this._buildOperationObject(OperationType.Read, query);
    return this._executeOperation(operation, options);
  }

  findById(id, options = {}) {
    if (!id) {
      return wrapInObservable((observer) => {
        observer.next();
        observer.complete();
      });
    }

    const operation = this._buildOperationObject(OperationType.ReadById, null, null, id);
    return this._executeOperation(operation, options);
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
    options = assign({ syncAutomatically: this.syncAutomatically }, options);
    const syncAutomatically = options.syncAutomatically === true;
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
        .catch(() => [])
        .then((cacheResult = []) => {
          observer.next(cacheResult);

          if (syncAutomatically === true) {
            // Attempt to push any pending sync data before fetching from the network.
            return this.pendingSyncCount(null, options)
              .then((syncCount) => {
                if (syncCount > 0) {
                  return this.push(null, options)
                    .then(() => this.pendingSyncCount(null, options));
                }

                return syncCount;
              })
              .then((syncCount) => {
                // Throw an error if there are still items that need to be synced
                if (syncCount > 0) {
                  throw new KinveyError('Unable to group entities on the backend.'
                    + ` There are ${syncCount} entities that need`
                    + ' to be synced.');
                }

                // Group the network entities
                return super.group(aggregation, options).toPromise();
              });
          }

          return cacheResult;
        })
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
    const operation = this._buildOperationObject(OperationType.Count, query);
    return this._executeOperation(operation, options);
  }

  /**
   * Create a single or an array of entities on the data store.
   *
   * @param   {Object}                entity                            Entity that you want to create on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  create(entity, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      if (isDefined(entity) === false) {
        observer.next(null);
        return observer.complete();
      }

      if (isArray(entity)) {
        return observer.error(new KinveyError(
          'Unable to create an array of entities.',
          'Please create entities one by one.'
        ));
      }

      return observer.complete();
    });

    return stream.toPromise()
      .then(() => {
        const operation = this._buildOperationObject(OperationType.Create, null, entity);
        return this._executeOperation(operation, options);
      });
  }

  /**
   * Update a single or an array of entities on the data store.
   *
   * @param   {Object}                entity                            Entity that you want to update on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  update(entity, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      if (isDefined(entity) === false) {
        observer.next(null);
        return observer.complete();
      }

      if (isArray(entity)) {
        return observer.error(new KinveyError(
          'Unable to update an array of entities.',
          'Please update entities one by one.'
        ));
      }

      if (isDefined(entity._id) === false) {
        return observer.error(new KinveyError(
          'The entity provided does not contain an _id. An _id is required to'
          + ' update the entity.', entity
        ));
      }

      const operation = this._buildOperationObject(OperationType.Update, null, entity);
      return this._executeOperation(operation, options)
        .then(entity => observer.next(entity))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream.toPromise();
  }

  /**
   * Remove all entities in the data store. A query can be optionally provided to remove
   * a subset of all entities in a collection or omitted to remove all entities in
   * a collection. The number of entities removed adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                           Query used to filter entities.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  remove(query, options = {}) {
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Query class.'));
    }

    const operation = this._buildOperationObject(OperationType.Delete, query);
    return this._executeOperation(operation, options)
      .then(count => ({ count }));
  }

  /**
   * Remove a single entity in the data store by id.
   *
   * @param   {string}                id                               Entity by id to remove.
   * @param   {Object}                [options]                        Options
   * @param   {Properties}            [options.properties]             Custom properties to send with
   *                                                                   the request.
   * @param   {Number}                [options.timeout]                Timeout for the request.
   * @return  {Observable}                                             Observable.
   */
  removeById(id, options = {}) {
    if (!isNonemptyString(id)) {
      // return Promise.reject(new KinveyError('Invalid id')); // TODO: why not?
      return Promise.resolve({ count: 0 }); // TODO: why not?
    }
    const operation = this._buildOperationObject(OperationType.DeleteById, null, null, id);
    return this._executeOperation(operation, options)
      .then(count => ({ count }));
  }

  /**
   * Remove all entities in the data store that are stored locally.
   *
   * @param   {Query}                 [query]                           Query used to filter entities.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  clear(query, options = {}) {
    const operation = this._buildOperationObject(OperationType.Clear, query);
    return this._executeOperation(operation, options)
      .then(count => ({ count }));
  }

  /**
   * Count the number of entities waiting to be pushed to the network. A promise will be
   * returned with the count of entities or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to count a subset of entities.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the local cache.
   * @return  {Promise}                                                         Promise
   */
  pendingSyncCount(query, options) {
    return this.syncManager.getSyncItemCount(this.collection);
  }

  pendingSyncEntities(query, options) {
    return this.syncManager.getSyncEntities(this.collection, query);
  }

  /**
   * Push sync items for the data store to the network. A promise will be returned that will be
   * resolved with the result of the push or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to push a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  push(query, options) {
    return this.syncManager.push(this.collection, query, options);
  }

  /**
   * Pull items for the data store from the network to your local cache. A promise will be
   * returned that will be resolved with the result of the pull or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to pull a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  pull(query, options = {}) {
    // options = assign({ useDeltaFetch: this.useDeltaFetch }, options);
    // const operation = this._buildOperationObject(OperationType.Pull, query);
    // return this._executeOperation(operation, options);
    return this.syncManager.getSyncItemCount(this.collection)
      .then((count) => {
        if (count > 0) {
          // const msg = `There are ${count} entities awaiting push. Please push before you attempt to pull`;
          // const err = new KinveyError(msg);
          // return Promise.reject(err);
          return this.syncManager.push(this.collection, query);
        }
        return this.syncManager.pull(this.collection, query, options);
      });
  }

  /**
   * Sync items for the data store. This will push pending sync items first and then
   * pull items from the network into your local cache. A promise will be
   * returned that will be resolved with the result of the pull or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to pull a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  sync(query, options) {
    options = assign({ useDeltaFetch: this.useDeltaFetch }, options);
    return this.push(query, options)
      .then((push) => {
        const promise = this.pull(query, options)
          .then((pull) => {
            const result = {
              push: push,
              pull: pull
            };
            return result;
          });
        return promise;
      });
  }

  clearSync(query, options) {
    // return this.syncManager.clearSync(query, options);
    return this.syncManager.clearSync(this.collection);
  }

  // protected

  _ensureValidQuery(query) {
    if (query && !(query instanceof Query)) {
      return wrapInObservable((observer) => {
        observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      });
    }
    return null;
  }
}
