/* eslint-disable no-underscore-dangle */
import { KinveyError, NotFoundError } from './errors';
import { CacheRequest } from './requests/cache';
import { DeltaFetchRequest } from './requests/deltafetch';
import { NetworkRequest } from './requests/network';
import { AuthType, RequestMethod, KinveyRequestConfig } from './requests/request';
import { Query } from './query';
import { KinveyObservable } from './utils/observable';
import { Client } from './client';
import { SyncManager } from './sync';
import { Metadata } from './metadata';
import differenceBy from 'lodash/differenceBy';
import keyBy from 'lodash/keyBy';
import isString from 'lodash/isString';
import url from 'url';
import filter from 'lodash/filter';
import map from 'lodash/map';
import xorWith from 'lodash/xorWith';
import isArray from 'lodash/isArray';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

/**
 * @typedef   {Object}    DataStoreType
 * @property  {string}    Cache           Cache datastore type
 * @property  {string}    Network         Network datastore type
 * @property  {string}    Sync            Sync datastore type
 */
const DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};
Object.freeze(DataStoreType);
export { DataStoreType };

export class DataStore {
  constructor(collection, options = {}) {
    if (!collection) {
      throw new KinveyError('A collection is required.');
    }

    if (!isString(collection)) {
      throw new KinveyError('Collection must be a string.');
    }

    /**
     * @type {string}
     */
    this.collection = collection;

    /**
     * @type {Client}
     */
    this.client = options.client || Client.sharedInstance();
  }

  /**
   * The pathname for the store.
   * @return  {string}  Pathname
   */
  get pathname() {
    return `/${appdataNamespace}/${this.client.appKey}/${this.collection}`;
  }

  async find() {
    throw new KinveyError('A subclass of DataStore must override the find function.');
  }

  async findById() {
    throw new KinveyError('A subclass of DataStore must override the findById function.');
  }

  async create() {
    throw new KinveyError('A subclass of DataStore must override the create function.');
  }

  async update() {
    throw new KinveyError('A subclass of DataStore must override the update function.');
  }

  /**
   * Save a single or an array of entities on the data store.
   *
   * @param   {Object|Array}          data                              Data that you want to save on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  save(data, options) {
    if (data[idAttribute]) {
      return this.update(data, options);
    }

    return this.create(data, options);
  }

  async remove() {
    throw new KinveyError('A subclass of DataStore must override the remove function.');
  }

  async removeById() {
    throw new KinveyError('A subclass of DataStore must override the removeById function.');
  }
}

export class NetworkStore extends DataStore {
  constructor(collection, options = {}) {
    super(collection, options);

    /**
     * @type {boolean}
     */
    this.useDeltaFetch = !!options.useDeltaFetch || false;
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
    const useDeltaFetch = options.useDeltaFetch || this.useDeltaFetch;
    const stream = KinveyObservable.create(async observer => {
      try {
        // Check that the query is valid
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        // Create the request
        const config = new KinveyRequestConfig({
          method: RequestMethod.GET,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: this.pathname,
            query: options.query
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: this.client
        });
        let request = new NetworkRequest(config);

        // Should we use delta fetch?
        if (useDeltaFetch === true) {
          request = new DeltaFetchRequest(config);
        }

        // Execute the request
        const response = await request.execute();

        // Send the response
        observer.next(response.data);
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
    const useDeltaFetch = options.useDeltaFetch || this.useDeltaFetch;
    const stream = KinveyObservable.create(async observer => {
      try {
        if (!id) {
          observer.next(undefined);
        } else {
          // Fetch data from the network
          const config = new KinveyRequestConfig({
            method: RequestMethod.GET,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this.pathname}/${id}`,
              query: options.query
            }),
            properties: options.properties,
            timeout: options.timeout,
            client: this.client
          });
          let request = new NetworkRequest(config);

          if (useDeltaFetch === true) {
            request = new DeltaFetchRequest(config);
          }

          const response = await request.execute();
          const data = response.data;
          observer.next(data);
        }
      } catch (error) {
        return observer.error(error);
      }

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

        // Create the request
        const config = new KinveyRequestConfig({
          method: RequestMethod.GET,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: `${this.pathname}/_count`,
            query: options.query
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: this.client
        });
        const request = new NetworkRequest(config);

        // Execute the request
        const response = await request.execute();
        const data = response.data;

        // Emit the count
        observer.next(data ? data.count : 0);
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

          if (!isArray(data)) {
            singular = true;
            data = [data];
          }

          const responses = await Promise.all(map(data, entity => {
            const config = new KinveyRequestConfig({
              method: RequestMethod.POST,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.protocol,
                host: this.client.host,
                pathname: this.pathname,
                query: options.query
              }),
              properties: options.properties,
              data: entity,
              timeout: options.timeout,
              client: this.client
            });
            const request = new NetworkRequest(config);
            return request.execute();
          }));

          data = map(responses, response => response.data);
          observer.next(singular ? data[0] : data);
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

          if (!isArray(data)) {
            singular = true;
            data = [data];
          }

          const responses = await Promise.all(map(data, entity => {
            const config = new KinveyRequestConfig({
              method: RequestMethod.PUT,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.protocol,
                host: this.client.host,
                pathname: this.pathname,
                query: options.query
              }),
              properties: options.properties,
              data: entity,
              timeout: options.timeout,
              client: this.client
            });
            const request = new NetworkRequest(config);
            return request.execute();
          }));

          data = map(responses, response => response.data);
          observer.next(singular ? data[0] : data);
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

        const config = new KinveyRequestConfig({
          method: RequestMethod.DELETE,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: this.pathname,
            query: options.query
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: this.client
        });
        const request = new NetworkRequest(config);
        const response = await request.execute();
        observer.next(response.data);
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
          observer.next(null);
        }

        const config = new KinveyRequestConfig({
          method: RequestMethod.DELETE,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: `${this.pathname}/${id}`,
            query: options.query
          }),
          properties: options.properties,
          timeout: options.timeout
        });
        const request = new NetworkRequest(config);
        const response = request.execute();
        observer.next(response.data);
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream.toPromise();
  }
}

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
        // Check that the query is valid
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        // Attempt to push any pending sync data before fetching from the network.
        let syncCount = await this.syncCount(null, options);
        if (syncCount > 0) {
          await this.push(null, options);
          syncCount = await this.syncCount(null, options);
        }

        // Throw an error if there are still items that need to be synced
        if (syncCount > 0) {
          throw new KinveyError('Unable to load data from the network.'
            + ` There are ${syncCount} entities that need`
            + ' to be synced before data is loaded from the network.');
        }

        let cacheEntities = [];

        try {
          // Fetch the cache entities
          const config = new KinveyRequestConfig({
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
          const request = new CacheRequest(config);

          // Execute the request
          const response = await request.execute();
          cacheEntities = response.data;

          // Emit the cache entities
          observer.next(cacheEntities);
        } catch (error) {
          // Swalllow the error and emit an empty array
          observer.next(cacheEntities);
        }

        // Fetch the network entities
        const networkEntities = await super.find(query, options).toPromise();

        // Remove entities from the cache that no longer exists
        const removedEntities = differenceBy(cacheEntities, networkEntities, idAttribute);
        const removedIds = Object.keys(keyBy(removedEntities, idAttribute));
        const removeQuery = new Query().contains(idAttribute, removedIds);
        await this.clear(removeQuery, options);

        // Save network entities to cache
        const saveConfig = new KinveyRequestConfig({
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
        const saveRequest = new CacheRequest(saveConfig);
        await saveRequest.execute();

        // Emit the network entities
        observer.next(networkEntities);
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
  findById(id, options) {
    const stream = KinveyObservable.create(async observer => {
      try {
        if (!id) {
          observer.next(undefined);
        } else {
          // Attempt to push any pending sync data before fetching from the network.
          let syncCount = await this.syncCount(null, options);
          if (syncCount > 0) {
            await this.push(null, options);
            syncCount = await this.syncCount(null, options);
          }

          // Throw an error if there are still items that need to be synced
          if (syncCount > 0) {
            throw new KinveyError('Unable to load data from the network.'
              + ` There are ${syncCount} entities that need`
              + ' to be synced before data is loaded from the network.');
          }

          try {
            // Fetch from the cache
            const config = new KinveyRequestConfig({
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
            const request = new CacheRequest(config);
            const response = await request.execute();
            const cacheEntity = response.data;

            // Emit the cache entity
            observer.next(cacheEntity);
          } catch (error) {
            // Swallow the error and emit undefined
            observer.next(undefined);
          }

          // Fetch from the network
          const networkEntity = await super.findById(id, options).toPromise();

          // Save the network entity to cache
          const saveConfig = new KinveyRequestConfig({
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
          const saveRequest = new CacheRequest(saveConfig);
          await saveRequest.execute();

          // Emit the network entity
          observer.next(networkEntity);
        }
      } catch (error) {
        // If the entity was not found then just remove it
        // from the cache
        if (error instanceof NotFoundError) {
          const query = new Query();
          query.equalTo('_id', id);
          await this.clear(id, options);
        }

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

        // Attempt to push any pending sync data before fetching from the network.
        let syncCount = await this.syncCount(null, options);
        if (syncCount > 0) {
          await this.push(null, options);
          syncCount = await this.syncCount(null, options);
        }

        // Throw an error if there are still items that need to be synced
        if (syncCount > 0) {
          throw new KinveyError('Unable to load data from the network.'
            + ` There are ${syncCount} entities that need`
            + ' to be synced before data is loaded from the network.');
        }

        try {
          // Count the entities in the cache
          const config = new KinveyRequestConfig({
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
          const request = new CacheRequest(config);

          // Execute the request
          const response = await request.execute();
          const data = response.data;

          // Emit the cache count
          observer.next(data ? data.count : 0);
        } catch (error) {
          // Swallow the error and emit 0
          observer.next(0);
        }

        // Get the count from the network
        const networkCount = super.count(query, options);

        // Emit the network count
        observer.next(networkCount);
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
          const config = new KinveyRequestConfig({
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
          const request = new CacheRequest(config);

          // Execute the request
          const response = await request.execute();
          data = response.data;

          // Add a create operation to sync
          await this.syncManager.addCreateOperation(data, options);

          // Push the data
          if (this.syncAutomatically === true) {
            const ids = Object.keys(keyBy(data, idAttribute));
            const query = new Query().contains('entity._id', ids);
            await this.push(query, options);
          }

          // Emit the data
          observer.next(singular ? data[0] : data);
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
          const config = new KinveyRequestConfig({
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
          const request = new CacheRequest(config);

          // Execute the request
          const response = await request.execute();
          data = response.data;

          // Add an update operation to sync
          await this.syncManager.addUpdateOperation(data, options);

          // Push the data
          if (this.syncAutomatically === true) {
            const ids = Object.keys(keyBy(data, idAttribute));
            const query = new Query().contains('entity._id', ids);
            await this.push(query, options);
          }

          // Emit the data
          observer.next(singular ? data[0] : data);
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
        const config = new KinveyRequestConfig({
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
        const request = new CacheRequest(config);

        // Execute the request
        const response = await request.execute();
        const entities = response.data;

        if (entities && entities.length > 0) {
          // Clear local entities from the sync table
          const localEntities = filter(entities, entity => {
            const metadata = new Metadata(entity);
            return metadata.isLocal();
          });
          const query = new Query().contains('entity._id', Object.keys(keyBy(localEntities, idAttribute)));
          await this.clearSync(query, options);

          // Create delete operations for non local data in the sync table
          const syncData = xorWith(entities, localEntities,
            (entity, localEntity) => entity[idAttribute] === localEntity[idAttribute]);
          await this.syncManager.addDeleteOperation(syncData, options);
        }

        // Push the data
        if (this.syncAutomatically === true) {
          const ids = Object.keys(keyBy(entities, idAttribute));
          const query = new Query().contains('entity._id', ids);
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
          const config = new KinveyRequestConfig({
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
          const request = new CacheRequest(config);

          // Execute the request
          const response = await request.execute();
          const entity = response.data;

          if (entity) {
            const metadata = new Metadata(entity);

            // Clear any pending sync items if the entity
            // was created locally
            if (metadata.isLocal()) {
              const query = new Query();
              query.equalTo('entity._id', entity[idAttribute]);
              await this.clearSync(query, options);
            } else {
              // Add a delete operation to sync
              await this.syncManager.addDeleteOperation(entity, options);
            }
          }

          // Push the data
          if (this.syncAutomatically === true) {
            const query = new Query().equalTo('entity._id', entity[idAttribute]);
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
          const config = new KinveyRequestConfig({
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
          const request = new CacheRequest(config);

          // Execute the request
          const response = await request.execute();
          const data = response.data;

          // Remove the data from sync
          if (data && data.length > 0) {
            const syncQuery = new Query().contains('entity._id', Object.keys(keyBy(data, idAttribute)));
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
  syncCount(query, options) {
    return this.syncManager.count(query, options);
  }

  pendingSyncItems(query, options) {
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
}

export class SyncStore extends CacheStore {
  get syncAutomatically() {
    return false;
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
        // Check that the query is valid
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        // Create the request
        const config = new KinveyRequestConfig({
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
        const request = new CacheRequest(config);

        // Execute the request
        const response = await request.execute();

        // Send the response
        observer.next(response.data);
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
          // Create the request
          const config = new KinveyRequestConfig({
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
          const request = new CacheRequest(config);

          // Execute the request
          const response = await request.execute();

          // Emit the data
          observer.next(response.data);
        }
      } catch (error) {
        return observer.error(error);
      }

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

        // Count the entities in the cache
        const config = new KinveyRequestConfig({
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
        const request = new CacheRequest(config);

        // Execute the request
        const response = await request.execute();
        const data = response.data;

        // Emit the cache count
        observer.next(data ? data.count : 0);
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream;
  }
}

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
 */
export class DataStoreManager {
  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       [collection]                  Name of the collection.
   * @param  {StoreType}    [type=DataStoreType.Network]  Type of store to return.
   * @return {DataStore}                                  DataStore instance.
   */
  static collection(collection, type = DataStoreType.Cache, options) {
    let store;

    switch (type) {
      case DataStoreType.Network:
        store = new NetworkStore(collection, options);
        break;
      case DataStoreType.Sync:
        store = new SyncStore(collection, options);
        break;
      case DataStoreType.Cache:
      default:
        store = new CacheStore(collection, options);

    }

    return store;
  }

  static getInstance(collection, type, options) {
    return DataStore.collection(collection, type, options);
  }
}
