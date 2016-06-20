
/* eslint-disable no-underscore-dangle */
import { KinveyError, NotFoundError } from './errors';
import { CacheRequest } from './requests/cache';
import { DeltaFetchRequest } from './requests/deltafetch';
import { NetworkRequest } from './requests/network';
import { AuthType, RequestMethod, KinveyRequestConfig } from './requests/request';
import { Query } from './query';
import { KinveyObservable } from './utils/observable';
import { Metadata } from './metadata';
import { Client } from './client';
import { SyncManager } from './sync';
import differenceBy from 'lodash/differenceBy';
import keyBy from 'lodash/keyBy';
import isString from 'lodash/isString';
import url from 'url';
import filter from 'lodash/filter';
import map from 'lodash/map';
import xorWith from 'lodash/xorWith';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
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
  constructor(collection, options) {
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
     * @type {number|undefined}
     */
    this.ttl = options.ttl || undefined;

    /**
     * @type {boolean}
     */
    this.useDeltaFetch = !!options.useDeltaFetch || false;

    /**
     * @type {Client}
     */
    this.client = options.client || Client.sharedInstance();

    /**
     * @type {SyncManager}
     */
    this.syncManager = new SyncManager(this.collection, options);
  }

  /**
   * The pathname for the store.
   * @return  {string}  Pathname
   */
  get pathname() {
    let pathname = `/${appdataNamespace}`;

    if (this.client) {
      pathname = `${pathname}/${this.client.appKey}`;
    }

    if (this.collection) {
      pathname = `${pathname}/${this.collection}`;
    }

    return pathname;
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
    if (data[idAttribute] && isFunction(this.update)) {
      return this.update(data, options);
    }

    if (isFunction(this.create)) {
      return this.create(data, options);
    }

    return data;
  }

  /**
   * Deletes the database.
   */
  static async clear(options = {}) {
    const client = options.client || Client.sharedInstance();
    const pathname = `/${appdataNamespace}/${client.appKey}`;
    const config = new KinveyRequestConfig({
      method: RequestMethod.DELETE,
      url: url.format({
        protocol: client.protocol,
        host: client.host,
        pathname: pathname,
        query: options.query
      }),
      properties: options.properties,
      timeout: options.timeout
    });
    const request = new CacheRequest(config);
    const response = await request.execute();
    return response.data;
  }
}

export class NetworkStore extends DataStore {
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
        if (options.useDeltaFetch === true) {
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

          if (options.useDeltaFetch === true) {
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

export class SyncStore extends DataStore {
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
    // Default useSync option to true
    options.useSync = options.useSync || true;

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
          const response = await request.execute();
          data = response.data;

          if (options.useSync === true && data.length > 0) {
            await this.syncManager.addCreateOperation(this.collection, data, options);
          }

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
    // Default useSync option to true
    options.useSync = options.useSync || true;

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
          const response = await request.execute();
          data = response.data;

          if (options.useSync === true && data.length > 0) {
            await this.syncManager.addUpdateOperation(this.collection, data, options);
          }

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
    // Default useSync option to true
    options.useSync = options.useSync || true;

    const stream = KinveyObservable.create(async observer => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

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
        const response = await request.execute();
        const data = response.data;

        if (options.useSync === true && data.length > 0) {
          // Clear local data from the sync table
          const localData = filter(data, entity => {
            const metadata = new Metadata(entity);
            return metadata.isLocal();
          });
          const query = new Query().contains('entity._id', Object.keys(keyBy(localData, idAttribute)));
          await this.syncManager.clear(query, options);

          // Create delete operations for non local data in the sync table
          const syncData = xorWith(data, localData,
            (entity, localEntity) => entity[idAttribute] === localEntity[idAttribute]);
          await this.syncManager.addDeleteOperation(this.collection, syncData, options);
        }

        observer.next(data);
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
    // Default useSync option to true
    options.useSync = options.useSync || true;

    const stream = KinveyObservable.create(async observer => {
      try {
        if (!id) {
          observer.next(null);
        }

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
        const response = await request.execute();
        const data = response.data;

        if (data) {
          const metadata = new Metadata(data);

          if (metadata.isLocal()) {
            const query = new Query();
            query.equalTo('entity._id', data[idAttribute]);
            await this.dataStoreSync.clear(this.collection, query, options);
          } else if (options.useSync === true) {
            await this.dataStoreSync.addDeleteOperation(this.collection, data, options);
          }
        }

        observer.next(data);
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
}

export class CacheStore extends SyncStore {
  constructor(collection, options) {
    super(collection, options);
    this.networkStore = new NetworkStore(collection, options);
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

        // Fetch the cache data
        const cacheEntities = await this.find(query, options).toPromise();
        observer.next(cacheEntities);

        // Fetch the network data
        const networkEntities = await this.networkStore.find(query, options).toPromise();

        // Set useSync option to false
        options.useSync = false;

        // Remove data from the cache that no longer exists
        const removedData = differenceBy(cacheEntities, networkEntities, idAttribute);
        const removedIds = Object.keys(keyBy(removedData, idAttribute));
        const removeQuery = new Query().contains(idAttribute, removedIds);
        await this.remove(removeQuery, options);

        // Save network data to cache
        await this.save(networkEntities, options);

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

        // Fetch from the cache
        const cacheEntity = await this.findById(id, options).toPromise();
        observer.next(cacheEntity);

        // Fetch from the network
        const networkEntity = await this.networkStore.findById(id, options).toPromise();

        // Set useSync option to false
        options.useSync = false;

        // Save the network entity to cache
        await this.save(networkEntity, options);

        // Emit the network entity
        observer.next(networkEntity);
      } catch (error) {
        // Set useSync option to false
        options.useSync = false;

        // If the entity was not found then just remove it
        // from the cache
        if (error instanceof NotFoundError) {
          await this.removeById(id, options);
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

          // Save the data to the cache
          data = await super.create(data, options);

          // Push the data
          const ids = Object.keys(keyBy(data, idAttribute));
          const query = new Query().contains('entity._id', ids);
          let push = await this.push(query, options);
          push = filter(push, result => !result.error);
          data = map(push, result => result.entity);

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

          if (!isArray(data)) {
            singular = true;
            data = [data];
          }

          // Save the data to the cache
          data = await super.update(data, options);

          // Push the data
          const ids = Object.keys(keyBy(data, idAttribute));
          const query = new Query().contains('entity._id', ids);
          let push = await this.push(query, options);
          push = filter(push, result => !result.error);
          data = map(push, result => result.entity);

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
        let data = await super.remove(query, options);

        // Push the data
        const ids = Object.keys(keyBy(data, idAttribute));
        const query = new Query().contains('entity._id', ids);
        let push = await this.push(query, options);
        push = filter(push, result => !result.error);
        data = map(push, result => result.entity);

        // Emit the data
        observer.next(data);
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

        // Remove from cache
        let data = await super.removeById(id, options);

        // Push the data
        const query = new Query().equalTo('entity._id', data[idAttribute]);
        let push = await this.push(query, options);
        push = filter(push, result => !result.error);
        data = map(push, result => result.entity);

        // Emit the data
        observer.next(data);
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream.toPromise();
  }
}

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
 */
export class DataStoreManager {
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
      if (query && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      try {
        if (this.isCacheEnabled()) {
          if (this.isOnline()) {
            let count = await this.syncCount();

            // Attempt to push any pending sync data before fetching from the network.
            if (count > 0) {
              await this.push();
              count = await this.syncCount();
            }

            // Throw an error if there are still items that need to be synced
            if (count > 0) {
              throw new KinveyError('Unable to count data. ' +
                `There are ${count} entities that need ` +
                'to be synced before data is counted.');
            }
          }

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
          const response = await request.execute();
          const data = response.data;
          observer.next(data ? data.count : 0);
        }
      } catch (error) {
        observer.next(null);
      }

      try {
        if (this.isOnline()) {
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
          const response = await request.execute();
          const data = response.data;
          observer.next(data ? data.count : 0);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream;
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
      // Check that the query is valid
      if (query && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      try {
        if (this.isCacheEnabled()) {
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
          const response = await request.execute();
          const data = response.data;

          if (data.length > 0) {
            const syncQuery = new Query().contains('entity._id', Object.keys(keyBy(data, idAttribute)));
            await this.dataStoreSync.clear(syncQuery, options);
          } else if (!query) {
            const syncQuery = new Query().equalTo('collection', this.collection);
            await this.dataStoreSync.clear(syncQuery, options);
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
