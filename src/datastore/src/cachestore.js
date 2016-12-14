import NetworkStore from './networkstore';
import { CacheRequest, AuthType, RequestMethod } from '../../request';
import { KinveyError } from '../../errors';
import Query from '../../query';
import Aggregation from '../../aggregation';
import SyncManager from './sync';
import { Metadata } from '../../entity';
import { KinveyObservable } from '../../utils';
import differenceBy from 'lodash/differenceBy';
import assign from 'lodash/assign';
import keyBy from 'lodash/keyBy';
import url from 'url';
import filter from 'lodash/filter';
import map from 'lodash/map';
import xorWith from 'lodash/xorWith';
import isArray from 'lodash/isArray';

/**
 * The CacheStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */
export default class CacheStore extends NetworkStore {
  constructor(collection, options = {}) {
    super(collection, options);

    /**
     * @type {number|undefined}
     */
    this.ttl = options.ttl || undefined;

    /**
     * @type {SyncManager}
     */
    this.syncManager = new SyncManager(this.collection, options);
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
    options = assign({ syncAutomatically: this.syncAutomatically }, options);
    const syncAutomatically = options.syncAutomatically === true;
    const stream = KinveyObservable.create((observer) => {
      // Check that the query is valid
      if (query && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      // Fetch the cache entities
      const request = new CacheRequest({
        method: RequestMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname,
          query: options.query
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .catch(() => [])
        .then((cacheEntities = []) => {
          observer.next(cacheEntities);

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
                  throw new KinveyError('Unable to load data from the network.'
                    + ` There are ${syncCount} entities that need`
                    + ' to be synced before data is loaded from the network.');
                }

                // Fetch the network entities
                return super.find(query, options).toPromise();
              })
              .then((networkEntities) => {
                // Remove entities from the cache that no longer exists
                const removedEntities = differenceBy(cacheEntities, networkEntities, '_id');
                const removedIds = Object.keys(keyBy(removedEntities, '_id'));
                const removeQuery = new Query().contains('_id', removedIds);
                return this.clear(removeQuery, options)
                  .then(() => networkEntities);
              })
              .then((networkEntities) => {
                // Save network entities to cache
                const request = new CacheRequest({
                  method: RequestMethod.PUT,
                  url: url.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  body: networkEntities,
                  timeout: options.timeout
                });
                return request.execute()
                  .then(response => response.data);
              });
          }

          return cacheEntities;
        })
        .then(entities => observer.next(entities))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream;
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
    options = assign({ syncAutomatically: this.syncAutomatically }, options);
    const syncAutomatically = options.syncAutomatically === true;
    const stream = KinveyObservable.create((observer) => {
      if (!id) {
        observer.next(undefined);
        return observer.complete();
      }

      // Fetch from the cache
      const request = new CacheRequest({
        method: RequestMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this.pathname}/${id}`,
          query: options.query
        }),
        properties: options.properties,
        timeout: options.timeout
      });
      return request.execute()
        .then(response => response.data)
        .catch(() => undefined)
        .then((cacheEntity) => {
          observer.next(cacheEntity);

          if (syncAutomatically === true) {
            // Attempt to push any pending sync data before fetching from the network.
            return this.pendingSyncCount(null, options)
              .then((syncCount) => {
                if (syncCount > 0) {
                  return this.push(null, options).then(() => this.pendingSyncCount(null, options));
                }

                return syncCount;
              })
              .then((syncCount) => {
                // Throw an error if there are still items that need to be synced
                if (syncCount > 0) {
                  throw new KinveyError('Unable to load data from the network.'
                    + ` There are ${syncCount} entities that need`
                    + ' to be synced before data is loaded from the network.');
                }
              })
              .then(() => super.findById(id, options).toPromise())
              .then((networkEntity) => {
                // Save the network entity to cache
                const request = new CacheRequest({
                  method: RequestMethod.PUT,
                  url: url.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  body: networkEntity,
                  timeout: options.timeout
                });
                return request.execute()
                  .then(response => response.data);
              });
          }

          return cacheEntity;
        })
        .then(entity => observer.next(entity))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream;
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
          protocol: this.client.protocol,
          host: this.client.host,
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
                  throw new KinveyError('Unable to load data from the network.'
                    + ` There are ${syncCount} entities that need`
                    + ' to be synced before data is loaded from the network.');
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
    options = assign({ syncAutomatically: this.syncAutomatically }, options);
    const syncAutomatically = options.syncAutomatically === true;
    const stream = KinveyObservable.create((observer) => {
      if (query && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      // Count the entities in the cache
      const request = new CacheRequest({
        method: RequestMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname,
          query: options.query
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .catch(() => [])
        .then((data = []) => data.length)
        .then((cacheCount) => {
          observer.next(cacheCount);

          if (syncAutomatically === true) {
            // Attempt to push any pending sync data before fetching from the network.
            return this.pendingSyncCount(null, options)
              .then((syncCount) => {
                if (syncCount > 0) {
                  return this.push(null, options).then(() => this.pendingSyncCount(null, options));
                }

                return syncCount;
              })
              .then((syncCount) => {
                // Throw an error if there are still items that need to be synced
                if (syncCount > 0) {
                  throw new KinveyError('Unable to load data from the network.'
                    + ` There are ${syncCount} entities that need`
                    + ' to be synced before data is loaded from the network.');
                }
              })
              .then(() => super.count(query, options).toPromise());
          }

          return cacheCount;
        })
        .then(count => observer.next(count))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream;
  }

  /**
   * Create a single or an array of entities on the data store.
   *
   * @param   {Object|Array}          data                              Data that you want to create on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  create(data, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      if (!data) {
        observer.next(null);
        observer.complete();
      }

      let singular = false;

      // Cast the data to an array
      if (!isArray(data)) {
        singular = true;
        data = [data];
      }

      // Save the data to the cache
      const request = new CacheRequest({
        method: RequestMethod.POST,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname,
          query: options.query
        }),
        properties: options.properties,
        body: data,
        timeout: options.timeout
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .then((data) => {
          return this.syncManager.addCreateOperation(data, options)
            .then(() => data);
        })
        .then((data) => {
          // Push the data
          if (this.syncAutomatically === true) {
            const ids = Object.keys(keyBy(data, '_id'));
            const query = new Query().contains('entityId', ids);
            return this.push(query, options)
              .then((results) => {
                return map(results, result => result.entity);
              });
          }

          return data;
        })
        .then(entities => observer.next(singular ? entities[0] : entities))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream.toPromise();
  }

  /**
   * Update a single or an array of entities on the data store.
   *
   * @param   {Object|Array}          data                              Data that you want to update on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  update(data, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      if (!data) {
        observer.next(null);
        return observer.complete();
      }

      let singular = false;

      // Cast the data to an array
      if (!isArray(data)) {
        singular = true;
        data = [data];
      }

      // Save the data to the cache
      const request = new CacheRequest({
        method: RequestMethod.PUT,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname,
          query: options.query
        }),
        properties: options.properties,
        body: data,
        timeout: options.timeout
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .then((data) => {
          return this.syncManager.addUpdateOperation(data, options)
            .then(() => data);
        })
        .then((data) => {
          // Push the data
          if (this.syncAutomatically === true) {
            const ids = Object.keys(keyBy(data, '_id'));
            const query = new Query().contains('entityId', ids);
            return this.push(query, options)
              .then((results) => {
                return map(results, result => result.entity);
              });
          }

          return data;
        })
        .then(entities => observer.next(singular ? entities[0] : entities))
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
    const stream = KinveyObservable.create((observer) => {
      if (query && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      // Fetch the cache entities
      const fetchRequest = new CacheRequest({
        method: RequestMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname,
          query: options.query
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });

      // Execute the request
      return fetchRequest.execute()
        .then(response => response.data)
        .then((entities) => {
          // Remove the data from the cache
          const removeRequest = new CacheRequest({
            method: RequestMethod.DELETE,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: this.pathname,
              query: options.query
            }),
            properties: options.properties,
            body: entities,
            timeout: options.timeout
          });

          // Execite the request
          return removeRequest.execute()
            .then(response => response.data);
        })
        .then((entities) => {
          if (entities && entities.length > 0) {
            // Clear local entities from the sync table
            const localEntities = filter(entities, (entity) => {
              const metadata = new Metadata(entity);
              return metadata.isLocal();
            });
            const query = new Query().contains('entityId', Object.keys(keyBy(localEntities, '_id')));
            return this.clearSync(query, options)
              .then(() => {
                // Create delete operations for non local data in the sync table
                const syncEntities = xorWith(entities, localEntities,
                  (entity, localEntity) => entity._id === localEntity._id);
                return this.syncManager.addDeleteOperation(syncEntities, options);
              })
              .then(() => entities);
          }

          return entities;
        })
        .then((entities) => {
          // Push the data
          if (this.syncAutomatically === true) {
            const ids = Object.keys(keyBy(entities, '_id'));
            const query = new Query().contains('entityId', ids);
            return this.push(query, options)
              .then(() => entities);
          }

          return entities;
        })
        .then(entities => observer.next(entities))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream.toPromise();
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
    const stream = KinveyObservable.create((observer) => {
      // Remove from cache
      const request = new CacheRequest({
        method: RequestMethod.DELETE,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this.pathname}/${id}`,
          query: options.query
        }),
        properties: options.properties,
        authType: AuthType.Default,
        timeout: options.timeout
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .then((entity) => {
          if (entity) {
            const metadata = new Metadata(entity);

            // Clear any pending sync items if the entity
            // was created locally
            if (metadata.isLocal()) {
              const query = new Query();
              query.equalTo('entityId', entity._id);
              return this.clearSync(query, options)
                .then(() => entity);
            }

            // Add a delete operation to sync
            return this.syncManager.addDeleteOperation(entity, options)
              .then(() => entity);
          }

          return entity;
        })
        .then((entity) => {
          // Push the data
          if (this.syncAutomatically === true) {
            const query = new Query().equalTo('entityId', entity._id);
            return this.push(query, options)
              .then(() => entity);
          }

          return entity;
        })
        .then(entity => observer.next(entity))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream.toPromise();
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
    const stream = KinveyObservable.create((observer) => {
      if (query && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      // Fetch the cache entities
      const request = new CacheRequest({
        method: RequestMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname,
          query: options.query
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .then((entities) => {
          // Remove the data from the cache
          const request = new CacheRequest({
            method: RequestMethod.DELETE,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: this.pathname,
              query: options.query
            }),
            properties: options.properties,
            body: entities,
            timeout: options.timeout
          });

          // Execute the request
          return request.execute()
            .then(response => response.data);
        })
        .then((entities) => {
          if (entities && entities.length > 0) {
            // Clear entities from the sync table
            const query = new Query().contains('entityId', Object.keys(keyBy(entities, '_id')));
            return this.clearSync(query, options)
              .then(() => entities);
          }

          return entities;
        })
        .then(entities => observer.next(entities))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream.toPromise();
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
    return this.syncManager.count(query, options);
  }

  syncCount(query, options) {
    return this.pendingSyncCount(query, options);
  }

  pendingSyncEntities(query, options) {
    return this.syncManager.find(query, options);
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
    return this.syncManager.push(query, options);
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
    options = assign({ useDeltaFetch: this.useDeltaFetch }, options);
    return this.syncManager.pull(query, options)
      .then((entities) => {
        // Clear the cache
        return this.clear(query, options)
          .then(() => {
            // Save network entities to cache
            const saveRequest = new CacheRequest({
              method: RequestMethod.PUT,
              url: url.format({
                protocol: this.client.protocol,
                host: this.client.host,
                pathname: this.pathname,
                query: options.query
              }),
              properties: options.properties,
              body: entities,
              timeout: options.timeout
            });
            return saveRequest.execute();
          })
          .then(() => entities);
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
    return this.push(null, options)
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
    return this.syncManager.clear(query, options);
  }

  /**
   * @deprecated Use clearSync() instead of this.
   */
  purge(query, options) {
    return this.clearSync(query, options);
  }
}
