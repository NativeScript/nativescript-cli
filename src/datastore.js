import { KinveyError, NotFoundError } from './errors';
import CacheRequest from './requests/cache';
import { DeltaFetchRequest } from './requests/deltafetch';
import { NetworkRequest } from './requests/network';
import { AuthType, RequestMethod } from './enums';
import { Query } from './query';
import { Observable } from 'rxjs/Observable';
import { toPromise } from 'rxjs/operator/toPromise';
import { Metadata } from './metadata';
import Client from './client';
import Sync from './sync';
// import assign from 'lodash/assign';
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
// const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
// const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
// const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const filesNamespace = process.env.KINVEY_FILES_NAMESPACE || 'blob';
const cacheEnabledSymbol = Symbol();
const onlineSymbol = Symbol();

/**
 * Enum for DataStore types.
 */
const DataStoreType = {
  Sync: 'Sync',
  Network: 'Network',
  User: 'User',
  File: 'File'
};
Object.freeze(DataStoreType);
export { DataStoreType };

/**
 * The DataStore class is used to find, save, update, remove, count and group entities.
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
     * @type {Number|undefined}
     */
    this.ttl = undefined;

    /**
     * @type {Boolean}
     */
    this.useDeltaFetch = false;

    /**
     * @private
     * @type {Client}
     */
    this.client = Client.sharedInstance();

    /**
     * @type {Sync}
     */
    this.sync = new Sync();
    this.sync.client = this.client;

    // Enable the cache
    this.enableCache();

    // Make the store online
    this.online();
  }

  /**
   * The pathname for the store.
   *
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
   * Disable cache.
   *
   * @return {DataStore}  DataStore instance.
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
   * Enable cache.
   *
   * @return {DataStore}  DataStore instance.
   */
  enableCache() {
    this[cacheEnabledSymbol] = true;
    return this;
  }

  /**
   * Check if cache is enabled.
   *
   * @return {Boolean}  True of false depending on if cache is enabled or disabled.
   */
  isCacheEnabled() {
    return this[cacheEnabledSymbol];
  }

  /**
   * Make the store offline.
   *
   * @return {DataStore}  DataStore instance.
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
   * Make the store online.
   *
   * @return {DataStore}  DataStore instance.
   */
  online() {
    this[onlineSymbol] = true;
    return this;
  }

  /**
   * Check if the store is online.
   *
   * @return {Boolean}  True of false depending on if the store is online or offline.
   */
  isOnline() {
    return this[onlineSymbol];
  }

  /**
   * Finds all entities in a collection. A query can be optionally provided to return
   * a subset of all entities in a collection or omitted to return all entities in
   * a collection. The number of entities returned adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                                   Query used to filter result.
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.\
   * @param   {Boolean}               [options.useDeltaFetch]                   Turn on or off the use of delta fetch
   *                                                                            for the find.
   * @return  {Promise|Object}                                                  Promise or object.
   */
  find(query, options = {}) {
    const stream = Observable.create(async observer => {
      try {
        const syncQuery = new Query().equalTo('collection', this.collection);
        let cacheData = [];
        let networkData = [];

        // Check that the query is valid
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        // Fetch data from cache
        if (this.isCacheEnabled()) {
          let count = await this.syncCount(syncQuery);

          // Attempt to push any pending sync data before fetching from the network.
          if (count > 0) {
            await this.push(syncQuery);
            count = await this.syncCount(syncQuery);
          }

          // Throw an error if there are still items that need to be synced
          if (count > 0) {
            throw new KinveyError('Unable to load data from the network. ' +
              `There are ${count} entities that need ` +
              'to be synced before data is loaded from the network.');
          }

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

          const response = await request.execute();
          cacheData = response.data;
          observer.next(cacheData);
        }

        // Fetch data from the network
        if (this.isOnline()) {
          const useDeltaFetch = options.useDeltaFetch || !!this.useDeltaFetch;
          const requestOptions = {
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
          };
          let request = new NetworkRequest(requestOptions);

          // Should we use delta fetch?
          if (useDeltaFetch) {
            request = new DeltaFetchRequest(requestOptions);
          }

          const response = await request.execute();
          networkData = response.data;

          if (this.isCacheEnabled()) {
            // Remove data from the cache that no longer exists on the network and
            // update the cache with data from the network
            const removedData = differenceBy(cacheData, networkData, idAttribute);
            const removedIds = Object.keys(keyBy(removedData, idAttribute));
            const removeQuery = new Query().contains(idAttribute, removedIds);
            const request = new CacheRequest({
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

  findById(id, options = {}) {
    const stream = Observable.create(async observer => {
      try {
        if (!id) {
          observer.next(null);
        } else if (this.isCacheEnabled()) {
          const syncQuery = new Query().equalTo('collection', this.collection);
          let count = await this.syncCount(syncQuery);

          // Attempt to push any pending sync data before fetching from the network.
          if (count > 0) {
            await this.push(syncQuery);
            count = await this.syncCount(syncQuery);
          }

          // Throw an error if there are still items that need to be synced
          if (count > 0) {
            throw new KinveyError('Unable to load data. ' +
              `There are ${count} entities that need ` +
              'to be synced before data can be loaded.');
          }

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
          observer.next(response.data);
        }

        // Fetch data from the network
        if (this.isOnline()) {
          const useDeltaFetch = options.useDeltaFetch || !!this.useDeltaFetch;
          const requestOptions = {
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
          };
          let request = new NetworkRequest(requestOptions);

          if (useDeltaFetch) {
            request = new DeltaFetchRequest(requestOptions);
          }

          try {
            const response = await request.execute();
            const data = response.data;
            observer.next(data);
            await this.updateCache(data);
          } catch (error) {
            if (error instanceof NotFoundError) {
              const request = new CacheRequest({
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

              await request.execute();
            }

            throw error;
          }
        }
      } catch (error) {
        return observer.error(error);
      }

      // Complete the observer
      return observer.complete();
    });

    return stream;
  }

  count(query, options = {}) {
    const stream = Observable.create(async observer => {
      try {
        if (this.isCacheEnabled()) {
          const syncQuery = new Query().equalTo('collection', this.collection);
          let count = await this.syncCount(syncQuery);

          // Attempt to push any pending sync data before fetching from the network.
          if (count > 0) {
            await this.push(syncQuery);
            count = await this.syncCount(syncQuery);
          }

          // Throw an error if there are still items that need to be synced
          if (count > 0) {
            throw new KinveyError('Unable to count data. ' +
              `There are ${count} entities that need ` +
              'to be synced before data is counted.');
          }

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

          const response = await request.execute();
          const data = response.data;
          observer.next(data ? data.count : 0);
        }

        if (this.isOnline()) {
          const request = new NetworkRequest({
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
          const response = await request.execute();
          const data = response.data;
          observer.next(data ? data.count : 0);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream::toPromise();
  }

  create(data, options = {}) {
    const stream = Observable.create(async observer => {
      try {
        let singular = false;

        if (!data) {
          observer.next(null);
        } else if (this.isCacheEnabled()) {
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

          const response = await request.execute();
          data = response.data;

          if (!isArray(data)) {
            singular = true;
            data = [data];
          }

          await Promise.all(map(data, entity => this.sync.addCreateOperation(this.collection, entity, options)));

          if (this.isOnline()) {
            const ids = Object.keys(keyBy(data, idAttribute));
            const query = new Query().contains('entityId', ids);
            let push = await this.push(query, options);
            push = filter(push, result => !result.error);
            data = map(push, result => result.entity);
          }

          observer.next(singular ? data[0] : data);
        } else {
          const request = new NetworkRequest({
            method: RequestMethod.POST,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: this.pathname,
              query: options.query
            }),
            properties: options.properties,
            data: data,
            timeout: options.timeout,
            client: this.client
          });
          const response = await request.execute();
          observer.next(response.data);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream::toPromise();
  }

  update(data, options = {}) {
    const observable = Observable.create(async observer => {
      try {
        let singular = false;
        const id = data[idAttribute];

        if (!data) {
          observer.next(null);
          return observer.complete();
        }

        if (this.isCacheEnabled()) {
          const request = new CacheRequest({
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

          const response = await request.execute();
          data = response.data;

          if (this.isOnline()) {
            if (!isArray(data)) {
              singular = true;
              data = [data];
            }

            await Promise.all(map(data, entity => this.sync.addUpdateOperation(this.collection, entity, options)));
            const ids = Object.keys(keyBy(data, idAttribute));
            const query = new Query().contains('entityId', ids);
            let push = await this.push(query, options);
            push = filter(push, result => !result.error);
            data = map(push, result => result.entity);
          }

          observer.next(singular ? data[0] : data);
          return observer.complete();
        }

        const request = new NetworkRequest({
          method: RequestMethod.POST,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: id ? `${this.pathname}/${id}` : this.pathname,
            query: options.query
          }),
          properties: options.properties,
          data: data,
          timeout: options.timeout,
          client: this.client
        });
        const response = await request.execute();
        observer.next(response.data);
      } catch (error) {
        observer.error(error);
      }

      return observer.complete();
    });

    return observable;
  }

  save(data, options) {
    if (data[idAttribute]) {
      return this.update(data, options);
    }

    return this.create(data, options);
  }

  remove(query, options = {}) {
    const stream = Observable.create(async observer => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        } else if (this.isCacheEnabled()) {
          const request = new CacheRequest({
            method: RequestMethod.DELETE,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: this.pathname,
              query: options.query
            }),
            properties: options.properties,
            query: query, // eslint-disable-line no-use-before-define
            timeout: options.timeout
          });

          const response = await request.execute();
          let data = response.data;

          // Clear local data from the sync table
          const localData = filter(data, entity => {
            const metadata = new Metadata(entity);
            return metadata.isLocal();
          });
          const query = new Query().contains('entityId', Object.keys(keyBy(localData, idAttribute)));
          await this.sync.clear(query, options);

          // Create delete operations for non local data in the sync table
          const syncData = xorWith(data, localData,
            (entity, localEntity) => entity[idAttribute] === localEntity[idAttribute]);
          await this.sync.addDeleteOperation(this.collection, syncData, options);

          if (this.isOnline()) {
            const ids = Object.keys(keyBy(syncData, idAttribute));
            const query = new Query().contains('entityId', ids);
            let push = await this.push(query, options);
            push = filter(push, result => !result.error);
            data = map(push, result => result.entity);
          }

          observer.next(data);
        } else {
          const request = new NetworkRequest({
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
          const response = await request.execute();
          observer.next(response.data);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream::toPromise();
  }

  removeById(id, options = {}) {
    const stream = Observable.create(async observer => {
      try {
        if (!id) {
          observer.next(null);
        } else if (this.isCacheEnabled()) {
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

          const response = await request.execute();
          let data = response.data;
          const metadata = new Metadata(data);

          if (metadata.isLocal()) {
            const query = new Query();
            query.equalTo('entityId', data[idAttribute]);
            await this.sync.clear(this.collection, query, options);
          } else {
            await this.sync.addDeleteOperation(this.collection, data, options);
          }

          if (this.isOnline()) {
            const query = new Query().equalTo('entityId', data[idAttribute]);
            let push = await this.push(query, options);
            push = filter(push, result => !result.error);
            data = map(push, result => result.entity);
          }

          observer.next(data);
        } else {
          const request = new NetworkRequest({
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
          const response = request.execute();
          observer.next(response.data);
        }
      } catch (error) {
        return observer.error(error);
      }

      return observer.complete();
    });

    return stream::toPromise();
  }

  /**
   * Push sync items for a collection to the network. A promise will be returned that will be
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
  async push(query, options = {}) {
    if (!this.isCacheEnabled()) {
      throw new KinveyError('The cache is disabled for this store.');
    }

    if (!(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    query.equalTo('collection', this.collection);
    return this.sync.push(query, options);
  }

  /**
   * Pull items for a collection from the network to your local cache. A promise will be
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
    const count = await this.syncCount(null, options);

    if (count > 0) {
      throw new KinveyError('Unable to pull data. You must push the pending sync items first.',
        'Call store.push() to push the pending sync items before you pull new data.');
    }

    return this.find(query, options).then(result => result.networkPromise);
  }

  /**
   * Sync items for a collection. This will push pending sync items first and then
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
    const push = await this.push(null, options);
    const pull = await this.pull(query, options);
    return {
      push: push,
      pull: pull
    };
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
  syncCount(query, options = {}) {
    if (!(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    query.equalTo('collection', this.collection);
    return this.sync.count(query, options);
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
    const request = new CacheRequest({
      method: RequestMethod.PUT,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname
      }),
      properties: options.properties,
      data: entities,
      timeout: options.timeout
    });
    const response = await request.execute();
    return response.data;
  }

  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       [collection]                  Name of the collection.
   * @param  {StoreType}    [type=DataStoreType.Network]  Type of store to return.
   * @return {DataStore}                                  DataStore instance.
   */
  static collection(collection, type = DataStoreType.Network) {
    const store = new DataStore(collection);
    store.enableCache();

    switch (type) {
      case DataStoreType.Sync:
        store.offline();
        break;
      case DataStoreType.Network:
      default:
        store.online();
    }

    return store;
  }
}

// /**
//  * The UserStore class is used to find, save, update, remove, count and group users.
//  */
// export class UserStore extends DataStore {
//   /**
//    * The pathname for the store.
//    *
//    * @return  {string}   Pathname
//    */
//   get pathname() {
//     return `/${usersNamespace}/${this.client.appKey}`;
//   }

//   save(user, options = {}) {
//     const promise = Promise.resolve().then(() => {
//       if (!user) {
//         throw new KinveyError('No user was provided to be updated.');
//       }

//       if (isArray(user)) {
//         throw new KinveyError('Please only update one user at a time.', user);
//       }

//       if (!user[idAttribute]) {
//         throw new KinveyError('User must have an _id.');
//       }

//       if (options._identity) {
//         const socialIdentity = user[socialIdentityAttribute];
//         if (socialIdentity) {
//           for (const [key] of socialIdentity) {
//             if (socialIdentity[key] && options._identity !== key) {
//               delete socialIdentity[key];
//             }
//           }
//         }
//       }

//       return super.save(user, options);
//     });

//     return promise;
//   }

//   exists(username, options) {
//     const request = new NetworkRequest({
//       method: HttpMethod.POST,
//       authType: AuthType.App,
//       url: url.format({
//         protocol: this.client.protocol,
//         host: this.client.host,
//         pathname: `/${rpcNamespace}/${this.client.appKey}/check-username-exists`
//       }),
//       properties: options.properties,
//       data: { username: username },
//       timeout: options.timeout,
//       client: this.client
//     });

//     const promise = request.execute().then(response => response.data.usernameExists);
//     return promise;
//   }

//   restore(id, options = {}) {
//     const request = new NetworkRequest({
//       method: HttpMethod.POST,
//       authType: AuthType.Master,
//       url: url.format({
//         protocol: this.client.protocol,
//         host: this.client.host,
//         pathname: `${this.pathname}/id`
//       }),
//       properties: options.properties,
//       timeout: options.timeout,
//       client: this.client
//     });

//     const promise = request.execute().then(response => response.data);
//     return promise;
//   }
// }

/**
 * The FileStore class is used to find, save, update, remove, count and group files.
 */
export class FileStore extends DataStore {
  constructor() {
    super();
    this.disableCache();
  }

  /**
   * Enable cache.
   *
   * @return {DataStore}  DataStore instance.
   */
  enableCache() {
    // Log a warning
    // throw new KinveyError('Unable to enable cache for the file store.');
  }

  /**
   * Make the store offline.
   *
   * @return {DataStore}  DataStore instance.
   */
  offline() {
    // Log a warning
    // throw new KinveyError('Unable to go offline for the file store.');
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}  Pathname
   */
  get pathname() {
    return `/${filesNamespace}/${this.client.appKey}`;
  }

  /**
   * Finds all files. A query can be optionally provided to return
   * a subset of all the files for your application or omitted to return all the files.
   * The number of files returned will adhere to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
   * promise will be returned that will be resolved with the files or rejected with
   * an error.
   *
   * @param   {Query}                 [query]                                   Query used to filter result.
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Boolean}               [options.tls]                             Use Transport Layer Security
   * @param   {Boolean}               [options.download]                        Download the files
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var filesStore = new Kinvey.FilesStore();
   * var query = new Kinvey.Query();
   * query.equalTo('location', 'Boston');
   * files.find(query, {
   *   tls: true, // Use transport layer security
   *   ttl: 60 * 60 * 24, // 1 day in seconds
   *   download: true // download the files
   * }).then(function(files) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  async find(query, options = {}) {
    options.query = options.query || {};
    options.query.tls = options.tls === true;
    options.ttl_in_seconds = options.ttl;

    const stream = super.find(query, options);
    const files = await stream::toPromise();

    if (options.download === true) {
      return Promise.all(map(files, file => this.downloadByUrl(file._downloadURL, options)));
    }

    return files;
  }

  findById(id, options) {
    return this.download(id, options);
  }

  /**
   * Download a file. A promise will be returned that will be resolved with the file or rejected with
   * an error.
   *
   * @param   {string}        name                                          Name
   * @param   {Object}        [options]                                     Options
   * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
   * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
   * @param   {Boolean}       [options.stream]                              Stream the file
   * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
   * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
   * @return  {Promise}                                                     Promise
   *
   * @example
   * var files = new Kinvey.Files();
   * files.download('BostonTeaParty.png', {
   *   tls: true, // Use transport layer security
   *   ttl: 60 * 60 * 24, // 1 day in seconds
   *   stream: true // stream the file
   * }).then(function(file) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
  */
  async download(name, options = {}) {
    options.query = options.query || {};
    options.query.tls = options.tls === true;
    options.ttl_in_seconds = options.ttl;

    const stream = super.findById(name, options);
    const file = await stream::toPromise();

    if (options.stream === true) {
      return file;
    }

    return this.downloadByUrl(file._downloadURL, options);
  }

  async downloadByUrl(url, options = {}) {
    const request = new NetworkRequest({
      method: RequestMethod.GET,
      url: url,
      timeout: options.timeout
    });
    request.setHeader('Accept', options.mimeType || 'application-octet-stream');
    request.removeHeader('Content-Type');
    request.removeHeader('X-Kinvey-Api-Version');
    const response = await request.execute();
    return response.data;
  }

  /**
   * Stream a file. A promise will be returned that will be resolved with the file or rejected with
   * an error.
   *
   * @param   {string}        name                                          File name
   * @param   {Object}        [options]                                     Options
   * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
   * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
   * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
   * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
   * @return  {Promise}                                                     Promise
   *
   * @example
   * var files = new Kinvey.Files();
   * files.stream('BostonTeaParty.png', {
   *   tls: true, // Use transport layer security
   *   ttl: 60 * 60 * 24, // 1 day in seconds
   * }).then(function(file) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  stream(name, options = {}) {
    options.stream = true;
    return this.download(name, options);
  }

  async upload(file, metadata = {}, options = {}) {
    metadata._filename = metadata._filename || file._filename || file.name;
    metadata.size = metadata.size || file.size || file.length;
    metadata.mimeType = metadata.mimeType || file.mimeType || file.type || 'application/octet-stream';

    if (options.public === true) {
      metadata._public = true;
    }

    const createRequest = new NetworkRequest({
      method: RequestMethod.POST,
      headers: {
        'X-Kinvey-Content-Type': metadata.mimeType
      },
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname
      }),
      properties: options.properties,
      timeout: options.timeout,
      data: metadata,
      client: this.client
    });

    if (metadata[idAttribute]) {
      createRequest.method = RequestMethod.PUT;
      createRequest.url = url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/${metadata._id}`,
        query: options.query
      });
    }

    const createResponse = await createRequest.execute();
    const data = createResponse.data;
    const uploadUrl = data._uploadURL;
    const headers = data._requiredHeaders || {};
    headers['Content-Type'] = metadata.mimeType;
    headers['Content-Length'] = metadata.size;

    // Delete fields from the response
    delete data._expiresAt;
    delete data._requiredHeaders;
    delete data._uploadURL;

    // Upload the file
    const uploadRequest = new NetworkRequest({
      method: RequestMethod.PUT,
      url: uploadUrl,
      data: file
    });
    uploadRequest.clearHeaders();
    uploadRequest.addHeaders(headers);
    await uploadRequest.execute();

    data._data = file;
    return data;
  }

  create(file, metadata, options) {
    return this.upload(file, metadata, options);
  }

  update(file, metadata, options) {
    return this.upload(file, metadata, options);
  }
}
