import { NetworkStore } from './networkstore';
import { KinveyError, CacheRequest, AuthType, RequestMethod } from '../../request';
import { Query } from './query';
import { SyncManager } from './sync';
import { Metadata } from '../../entity';
import { KinveyObservable } from '../../utils';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import differenceBy from 'lodash/differenceBy';
import keyBy from 'lodash/keyBy';
import url from 'url';
import filter from 'lodash/filter';
import map from 'lodash/map';
import xorWith from 'lodash/xorWith';
import isArray from 'lodash/isArray';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The CacheStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */
export class CacheStore extends NetworkStore {
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
    const stream = KinveyObservable.create(async observer => {
      try {
        let cacheEntities = [];

        try {
          // Check that the query is valid
          if (query && !(query instanceof Query)) {
            throw new KinveyError('Invalid query. It must be an instance of the Query class.');
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
          const response = await request.execute();
          cacheEntities = response.data;

          // Emit the cache entities
          observer.next(cacheEntities);
        } catch (error) {
          // Just catch the error
        }

        if (this.syncAutomatically === true) {
          // Attempt to push any pending sync data before fetching from the network.
          let syncCount = await this.pendingSyncCount(null, options);
          if (syncCount > 0) {
            await this.push(null, options);
            syncCount = await this.pendingSyncCount(null, options);
          }

          // Throw an error if there are still items that need to be synced
          if (syncCount > 0) {
            throw new KinveyError('Unable to load data from the network.'
              + ` There are ${syncCount} entities that need`
              + ' to be synced before data is loaded from the network.');
          }

          // Fetch the network entities
          const networkEntities = await super.find(query, options).toPromise();

          // Remove entities from the cache that no longer exists
          const removedEntities = differenceBy(cacheEntities, networkEntities, idAttribute);
          const removedIds = Object.keys(keyBy(removedEntities, idAttribute));
          const removeQuery = new Query().contains(idAttribute, removedIds);
          await this.clear(removeQuery, options);

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
            body: networkEntities,
            timeout: options.timeout
          });
          await saveRequest.execute();

          // Emit the network entities
          observer.next(networkEntities);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
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
    const stream = KinveyObservable.create(async observer => {
      try {
        if (!id) {
          observer.next(undefined);
        } else {
          try {
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
            const response = await request.execute();
            const cacheEntity = response.data;

            // Emit the cache entity
            observer.next(cacheEntity);
          } catch (error) {
            // Just catch the error
          }

          if (this.syncAutomatically === true) {
            // Attempt to push any pending sync data before fetching from the network.
            let syncCount = await this.pendingSyncCount(null, options);
            if (syncCount > 0) {
              await this.push(null, options);
              syncCount = await this.pendingSyncCount(null, options);
            }

            // Throw an error if there are still items that need to be synced
            if (syncCount > 0) {
              throw new KinveyError('Unable to load data from the network.'
                + ` There are ${syncCount} entities that need`
                + ' to be synced before data is loaded from the network.');
            }

            // Fetch from the network
            const networkEntity = await super.findById(id, options).toPromise();

            // Save the network entity to cache
            const saveRequest = new CacheRequest({
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
            await saveRequest.execute();

            // Emit the network entity
            observer.next(networkEntity);
          }
        }
      } catch (error) {
        // Emit the error
        return observer.error(error);
      }

      // Complete the stream
      return observer.complete();
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
    const stream = KinveyObservable.create(async observer => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        try {
          // Count the entities in the cache
          const request = new CacheRequest({
            method: RequestMethod.GET,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this.pathname}/_count`,
              query: options.query
            }),
            properties: options.properties,
            query: query,
            timeout: options.timeout
          });

          // Execute the request
          const response = await request.execute();
          const data = response.data;

          // Emit the cache count
          observer.next(data ? data.count : 0);
        } catch (error) {
          // Just catch the error
        }

        if (this.syncAutomatically === true) {
          // Attempt to push any pending sync data before fetching from the network.
          let syncCount = await this.pendingSyncCount(null, options);
          if (syncCount > 0) {
            await this.push(null, options);
            syncCount = await this.pendingSyncCount(null, options);
          }

          // Throw an error if there are still items that need to be synced
          if (syncCount > 0) {
            throw new KinveyError('Unable to load data from the network.'
              + ` There are ${syncCount} entities that need`
              + ' to be synced before data is loaded from the network.');
          }

          // Get the count from the network
          const networkCount = await super.count(query, options).toPromise();

          // Emit the network count
          observer.next(networkCount);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
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
    const stream = KinveyObservable.create(async observer => {
      try {
        if (!data) {
          observer.next(null);
        } else {
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
          const response = await request.execute();
          data = response.data;

          // Add a create operation to sync
          await this.syncManager.addCreateOperation(data, options);

          // Push the data
          if (this.syncAutomatically === true) {
            const ids = Object.keys(keyBy(data, idAttribute));
            const query = new Query().contains('entityId', ids);
            const results = await this.push(query, options);
            const entities = map(results, result => result.entity);

            // Emit the data
            observer.next(singular ? entities[0] : entities);
          } else {
            // Emit the data
            observer.next(singular ? data[0] : data);
          }
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
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
    const stream = KinveyObservable.create(async observer => {
      try {
        if (!data) {
          observer.next(null);
        } else {
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
          const response = await request.execute();
          data = response.data;

          // Add an update operation to sync
          await this.syncManager.addUpdateOperation(data, options);

          // Push the data
          if (this.syncAutomatically === true) {
            const ids = Object.keys(keyBy(data, idAttribute));
            const query = new Query().contains('entityId', ids);
            const results = await this.push(query, options);
            const entities = map(results, result => result.entity);

            // Emit the data
            observer.next(singular ? entities[0] : entities);
          } else {
            // Emit the data
            observer.next(singular ? data[0] : data);
          }
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
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
    const stream = KinveyObservable.create(async observer => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

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
          query: query,
          timeout: options.timeout
        });

        // Execute the request
        const response = await request.execute();
        const entities = response.data;

        if (entities && entities.length > 0) {
          // Clear local entities from the sync table
          const localEntities = filter(entities, entity => {
            const metadata = new Metadata(entity);
            return metadata.isLocal();
          });
          const query = new Query().contains('entityId', Object.keys(keyBy(localEntities, idAttribute)));
          await this.clearSync(query, options);

          // Create delete operations for non local data in the sync table
          const syncData = xorWith(entities, localEntities,
            (entity, localEntity) => entity[idAttribute] === localEntity[idAttribute]);
          await this.syncManager.addDeleteOperation(syncData, options);
        }

        // Push the data
        if (this.syncAutomatically === true) {
          const ids = Object.keys(keyBy(entities, idAttribute));
          const query = new Query().contains('entityId', ids);
          await this.push(query, options);
        }

        // Emit the data
        observer.next(entities);
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
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
    const stream = KinveyObservable.create(async observer => {
      try {
        if (!id) {
          observer.next(undefined);
        } else {
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
          const response = await request.execute();
          const entity = response.data;

          if (entity) {
            const metadata = new Metadata(entity);

            // Clear any pending sync items if the entity
            // was created locally
            if (metadata.isLocal()) {
              const query = new Query();
              query.equalTo('entityId', entity[idAttribute]);
              await this.clearSync(query, options);
            } else {
              // Add a delete operation to sync
              await this.syncManager.addDeleteOperation(entity, options);
            }
          }

          // Push the data
          if (this.syncAutomatically === true) {
            const query = new Query().equalTo('entityId', entity[idAttribute]);
            await this.push(query, options);
          }

          // Emit the data
          observer.next(entity);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
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
    const stream = KinveyObservable.create(async observer => {
      try {
        // Check that the query is valid
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        } else {
          // Create the request
          const request = new CacheRequest({
            method: RequestMethod.DELETE,
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
          const response = await request.execute();
          const data = response.data;

          // Remove the data from sync
          if (data && data.length > 0) {
            const syncQuery = new Query().contains('entityId', Object.keys(keyBy(data, idAttribute)));
            await this.clearSync(syncQuery, options);
          } else if (!query) {
            await this.clearSync(null, options);
          }

          observer.next(data);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
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
  pull(query, options) {
    return this.syncManager.pull(query, options);
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
    return this.syncManager.sync(query, options);
  }

  clearSync(query, options) {
    return this.syncManager.clear(query, options);
  }

  purge(query, options) {
    return this.clearSync(query, options);
  }
}
