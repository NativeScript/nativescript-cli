
/* eslint-disable no-underscore-dangle */
import { KinveyError, NotFoundError } from './errors';
import CacheRequest from './requests/cache';
import { DeltaFetchRequest } from './requests/deltafetch';
import { NetworkRequest } from './requests/network';
import { AuthType, RequestMethod, KinveyRequestConfig } from './requests/request';
import { Query } from './query';
import { KinveyObservable } from './utils/observable';
import { Metadata } from './metadata';
import Client from './client';
import Symbol from 'es6-symbol';
import Sync from './sync';
import differenceBy from 'lodash/differenceBy';
import keyBy from 'lodash/keyBy';
import isString from 'lodash/isString';
import url from 'url';
import filter from 'lodash/filter';
import map from 'lodash/map';
import result from 'lodash/result';
import isArray from 'lodash/isArray';
import xorWith from 'lodash/xorWith';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const cacheEnabledSymbol = Symbol();
const onlineSymbol = Symbol();

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

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
 */
export class DataStore {
  constructor(collection) {
    if (collection && !isString(collection)) {
      throw new KinveyError('Collection must be a string.');
    }

    /**
     * @type {string}
     */
    this.collection = collection;

    /**
     * @type {number|undefined}
     */
    this.ttl = undefined;

    /**
     * @type {boolean}
     */
    this.useDeltaFetch = false;

    /**
     * @private
     * @type {Client}
     */
    this.client = Client.sharedInstance();

    /**
     * @private
     * @type {Sync}
     */
    this.dataStoreSync = new Sync();
    this.dataStoreSync.client = this.client;

    // The store is online and has the cache enabled by default.
    this.online();
    this.enableCache();
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
   * Disable the cache for the data store.
   * @return  {DataStore}  DataStore instance.
   */
  disableCache() {
    if (!this.isOnline()) {
      throw new KinveyError('Unable to disable the cache when the store is offline. Please make the store ' +
        'online by calling `store.online()`.');
    }

    this[cacheEnabledSymbol] = false;
    return this;
  }

  /**
   * Enable the cache for the data store.
   * @return  {DataStore}  DataStore instance.
   */
  enableCache() {
    this[cacheEnabledSymbol] = true;
    return this;
  }

  /**
   * Check if the cache is enabled or disabled for the data store.
   * @return  {Boolean}  True or false depending on if the cache is enabled or disabled.
   */
  isCacheEnabled() {
    return this[cacheEnabledSymbol];
  }

  /**
   * Make the data store go offline.
   * @return  {DataStore}  DataStore instance.
   */
  offline() {
    if (!this.isCacheEnabled()) {
      throw new KinveyError('Unable to go offline when the cache for the store is disabled. Please enable the cache ' +
        'by calling `store.enableCache()`.');
    }

    this[onlineSymbol] = false;
    return this;
  }

  /**
   * Make the data store go online.
   * @return  {DataStore}  DataStore instance.
   */
  online() {
    this[onlineSymbol] = true;
    return this;
  }

  /**
   * Check if the data store is online or offline.
   * @return  {Boolean}  True or false depending on if the data store is online or offline.
   */
  isOnline() {
    return this[onlineSymbol];
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
      let cacheData = [];
      let networkData = [];

      // Check that the query is valid
      if (query && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      try {
        // Fetch data from cache
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
              throw new KinveyError('Unable to load data from the network. ' +
                `There are ${count} entities that need ` +
                'to be synced before data is loaded from the network.');
            }
          }

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
          const response = await request.execute();
          cacheData = response.data;
          observer.next(cacheData);
        }
      } catch (error) {
        observer.next([]);
      }

      try {
        // Fetch data from the network
        if (this.isOnline()) {
          const useDeltaFetch = options.useDeltaFetch || !!this.useDeltaFetch;
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
          if (useDeltaFetch) {
            request = new DeltaFetchRequest(config);
          }

          const response = await request.execute();
          networkData = response.data;

          if (this.isCacheEnabled()) {
            // Remove data from the cache that no longer exists on the network and
            // update the cache with data from the network
            const removedData = differenceBy(cacheData, networkData, idAttribute);
            const removedIds = Object.keys(keyBy(removedData, idAttribute));
            const removeQuery = new Query().contains(idAttribute, removedIds);
            const config = new KinveyRequestConfig({
              method: RequestMethod.DELETE,
              url: url.format({
                protocol: this.client.protocol,
                host: this.client.host,
                pathname: this.pathname,
                query: options.query
              }),
              properties: options.properties,
              query: removeQuery,
              timeout: options.timeout
            });
            const request = new CacheRequest(config);
            await request.execute();
            await this.updateCache(networkData);
          }

          observer.next(networkData);
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
      if (!id) {
        observer.next(null);
      } else {
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
                throw new KinveyError('Unable to load data. ' +
                  `There are ${count} entities that need ` +
                  'to be synced before data can be loaded.');
              }
            }

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
          observer.next(undefined);
        }

        try {
          // Fetch data from the network
          if (this.isOnline()) {
            const useDeltaFetch = options.useDeltaFetch || !!this.useDeltaFetch;
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

            if (useDeltaFetch) {
              request = new DeltaFetchRequest(config);
            }

            const response = await request.execute();
            const data = response.data;
            observer.next(data);
            await this.updateCache(data);
          }
        } catch (error) {
          if (error instanceof NotFoundError) {
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
            const request = new CacheRequest(config);
            await request.execute();
          }

          return observer.error(error);
        }
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

          if (this.isCacheEnabled()) {
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

            if (data.length > 0) {
              await this.dataStoreSync.addCreateOperation(this.collection, data, options);

              if (this.isOnline()) {
                const ids = Object.keys(keyBy(data, idAttribute));
                const query = new Query().contains('entity._id', ids);
                let push = await this.push(query, options);
                push = filter(push, result => !result.error);
                data = map(push, result => result.entity);
              }
            }

            observer.next(singular ? data[0] : data);
          } else if (this.isOnline()) {
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
          const id = data[idAttribute];

          if (!isArray(data)) {
            singular = true;
            data = [data];
          }

          if (this.isCacheEnabled()) {
            const config = new KinveyRequestConfig({
              method: RequestMethod.PUT,
              url: url.format({
                protocol: this.client.protocol,
                host: this.client.host,
                pathname: id ? `${this.pathname}/${id}` : this.pathname,
                query: options.query
              }),
              properties: options.properties,
              body: data,
              timeout: options.timeout
            });
            const request = new CacheRequest(config);
            const response = await request.execute();
            data = response.data;

            if (data.length > 0) {
              await this.dataStoreSync.addUpdateOperation(this.collection, data, options);

              if (this.isOnline()) {
                const ids = Object.keys(keyBy(data, idAttribute));
                const query = new Query().contains('entity._id', ids);
                let push = await this.push(query, options);
                push = filter(push, result => !result.error);
                data = map(push, result => result.entity);
              }
            }

            observer.next(singular ? data[0] : data);
          } else if (this.isOnline()) {
            const responses = await Promise.all(map(data, entity => {
              const id = entity[idAttribute];
              const config = new KinveyRequestConfig({
                method: RequestMethod.PUT,
                authType: AuthType.Default,
                url: url.format({
                  protocol: this.client.protocol,
                  host: this.client.host,
                  pathname: id ? `${this.pathname}/${id}` : this.pathname,
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
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream.toPromise();
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
        } else if (this.isCacheEnabled()) {
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
          let data = response.data;

          if (data.length > 0) {
            // Clear local data from the sync table
            const localData = filter(data, entity => {
              const metadata = new Metadata(entity);
              return metadata.isLocal();
            });
            const query = new Query().contains('entity._id', Object.keys(keyBy(localData, idAttribute)));
            await this.dataStoreSync.clear(query, options);

            // Create delete operations for non local data in the sync table
            const syncData = xorWith(data, localData,
              (entity, localEntity) => entity[idAttribute] === localEntity[idAttribute]);
            await this.dataStoreSync.addDeleteOperation(this.collection, syncData, options);

            if (this.isOnline()) {
              const ids = Object.keys(keyBy(syncData, idAttribute));
              const query = new Query().contains('entity._id', ids);
              let push = await this.push(query, options);
              push = filter(push, result => !result.error);
              data = map(push, result => result.entity);
            }
          }

          observer.next(data);
        } else if (this.isOnline()) {
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
        }
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
        } else if (this.isCacheEnabled()) {
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
          let data = response.data;

          if (data) {
            const metadata = new Metadata(data);

            if (metadata.isLocal()) {
              const query = new Query();
              query.equalTo('entity._id', data[idAttribute]);
              await this.dataStoreSync.clear(this.collection, query, options);
            } else {
              await this.dataStoreSync.addDeleteOperation(this.collection, data, options);
            }

            if (this.isOnline()) {
              const query = new Query().equalTo('entity._id', data[idAttribute]);
              let push = await this.push(query, options);
              push = filter(push, result => !result.error);
              data = map(push, result => result.entity);
            }
          }

          observer.next(data);
        } else if (this.isOnline()) {
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
   * Push sync items for the data store to the network. A promise will be returned that will be
   * resolved with the result of the push or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to push a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.DataStore.getInstance('books');
   * store.push().then(function(result) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  async push(query = new Query(), options = {}) {
    if (this.isCacheEnabled()) {
      if (!(query instanceof Query)) {
        query = new Query(result(query, 'toJSON', query));
      }

      query.equalTo('collection', this.collection);
      return this.dataStoreSync.push(query, options);
    }

    throw new KinveyError('Unable to push because the cache is disabled.');
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
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.pull().then(function(result) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  async pull(query, options = {}) {
    if (this.isCacheEnabled()) {
      const count = await this.syncCount(null, options);

      if (count > 0) {
        throw new KinveyError('Unable to pull data. You must push the pending sync items first.',
          'Call store.push() to push the pending sync items before you pull new data.');
      }

      const prevOnlineState = this.isOnline();
      this.online();
      return this.find(query, options)
        .toPromise()
        .then(data => {
          if (prevOnlineState === false) {
            this.offline();
          }

          return data;
        })
        .catch(error => {
          if (prevOnlineState === false) {
            this.offline();
          }

          throw error;
        });
    }

    throw new KinveyError('Unable to pull because the cache is disabled.');
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
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.sync().then(function(result) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  async sync(query, options = {}) {
    if (this.isCacheEnabled()) {
      const push = await this.push(null, options);
      const pull = await this.pull(query, options);
      return {
        push: push,
        pull: pull
      };
    }

    throw new KinveyError('Unable to sync because the cache is disabled.');
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
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.syncCount().then(function(count) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  async syncCount(query = new Query(), options = {}) {
    if (this.isCacheEnabled()) {
      if (!(query instanceof Query)) {
        query = new Query(result(query, 'toJSON', query));
      }

      query.equalTo('collection', this.collection);
      return this.dataStoreSync.count(query, options);
    }

    throw new KinveyError('Unable to get the sync count because the cache is disabled.');
  }

  /**
   * Add or update entities stored in the cache. A promise will be returned with the entities
   * or rejected with an error.
   *
   * @param   {Object|Array}          entities                                  Entity(s) to add or update in the cache.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  async updateCache(entities, options = {}) {
    if (this.isCacheEnabled()) {
      const config = new KinveyRequestConfig({
        method: RequestMethod.PUT,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname,
          query: options.query
        }),
        properties: options.properties,
        data: entities,
        timeout: options.timeout
      });
      const request = new CacheRequest(config);
      const response = await request.execute();
      return response.data;
    }

    throw new KinveyError('Unable to update the cache because the cache is disabled.');
  }

  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       [collection]                  Name of the collection.
   * @param  {StoreType}    [type=DataStoreType.Network]  Type of store to return.
   * @return {DataStore}                                  DataStore instance.
   */
  static collection(collection, type = DataStoreType.Cache) {
    const store = new DataStore(collection);

    switch (type) {
      case DataStoreType.Network:
        store.online();
        store.disableCache();
        break;
      case DataStoreType.Sync:
        store.enableCache();
        store.offline();
        break;
      case DataStoreType.Cache:
      default:
        store.online();
        store.enableCache();

    }

    return store;
  }

  static getInstance(collection, type) {
    return DataStore.collection(collection, type);
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
