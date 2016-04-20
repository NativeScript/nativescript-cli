import Promise from 'babybird';
import { NetworkStore } from './networkstore';
import { AuthType, HttpMethod } from '../enums';
import { KinveyError, NotFoundError } from '../errors';
import { LocalRequest } from '../requests/local';
import { DeltaFetchRequest } from '../requests/deltafetch';
import { Query } from '../query';
import { Aggregation } from '../aggregation';
import { Log } from '../log';
import url from 'url';
import assign from 'lodash/assign';
import result from 'lodash/result';
import isArray from 'lodash/isArray';
import keyBy from 'lodash/keyBy';
import map from 'lodash/map';
import differenceBy from 'lodash/differenceBy';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The CacheStore class is used to find, save, update, remove, count and group enitities
 * in a collection on the network using a cache on the device.
 */
class CacheStore extends NetworkStore {
  /**
   * Creates a new instance of the CacheStore class.
   *
   * @param   {string}  name   Name of the collection
   *
   * @throws  {KinveyError}   If the name provided is not a string.
   */
  constructor(name) {
    super(name);

    /**
     * @type {Number}
     */
    this.ttl = undefined;

    // Enable sync
    this.enableSync();
  }

  disableSync() {
    this._syncEnabled = false;
  }

  enableSync() {
    this._syncEnabled = true;
  }

  isSyncEnabled() {
    return !!this._syncEnabled;
  }

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
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the cache.
   * @return  {Promise}                                                         Promise
   */
  find(query, options = {}) {
    Log.debug(`Retrieving the entities in the ${this.name} collection.`, query);

    options = assign({
      useDeltaFetch: true
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute();
    }).then(cacheResponse => {
      const result = {
        cache: cacheResponse.data
      };

      result.networkPromise = this.syncCount().then(count => {
        if (count > 0) {
          return this.push().then(() => this.syncCount());
        }

        return count;
      }).then(count => {
        if (count > 0) {
          throw new KinveyError(`Unable to load data from the network. There are ${count} entities that need ` +
           'to be synced before data is loaded from the network.');
        }

        if (options.useDeltaFetch) {
          const request = new DeltaFetchRequest({
            method: HttpMethod.GET,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: this._pathname
            }),
            properties: options.properties,
            query: query,
            timeout: options.timeout,
            client: this.client
          });
          return request.execute().then(response => response.data);
        }

        return super.find(query, options);
      }).then(networkEntities => {
        const removedEntities = differenceBy(cacheResponse.data, networkEntities, idAttribute);
        const removeEntityIds = Object.keys(keyBy(removedEntities, idAttribute));
        const removeQuery = new Query();
        removeQuery.contains(idAttribute, removeEntityIds);

        const request = new LocalRequest({
          method: HttpMethod.DELETE,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: this._pathname
          }),
          properties: options.properties,
          query: removeQuery,
          timeout: options.timeout,
          client: this.client
        });
        return request.execute().then(() => this._cache(networkEntities));
      });

      return result;
    });

    promise.then(response => {
      Log.info(`Retrieved the entities in the ${this.name} collection.`, response);
    }).catch(err => {
      Log.error(`Failed to retrieve the entities in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Groups entities in a collection. An aggregation can be optionally provided to group
   * a subset of entities in a collection or omitted to group all the entities
   * in a collection. A promise will be returned that will be resolved with the result
   * or rejected with an error.
   *
   * @param   {Aggregation}           aggregation                               Aggregation used to group entities.
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the cache.
   * @return  {Promise}                                                         Promise
   */
  group(aggregation, options = {}) {
    Log.debug(`Grouping the entities in the ${this.name} collection.`, aggregation, options);

    options = assign({
      force: false
    }, options);

    if (!(aggregation instanceof Aggregation)) {
      return Promise.reject(new KinveyError('Invalid aggregation. ' +
        'It must be an instance of the Kinvey.Aggregation class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this._pathname}/_group`
        }),
        properties: options.properties,
        data: aggregation.toJSON(),
        timeout: options.timeout,
        client: this.client
      });
      return request.execute();
    }).then(response => {
      const result = {
        cache: response.data
      };

      result.networkPromise = this.syncCount().then(count => {
        if (count > 0) {
          return this.push().then(() => this.syncCount());
        }

        return count;
      }).then(count => {
        if (count > 0) {
          throw new KinveyError(`Unable to load data from the network. There are ${count} entities that need ` +
           'to be synced before data is loaded from the network.');
        }

        return super.group(aggregation, options);
      });

      return result;
    });

    promise.then(response => {
      Log.info(`Grouped the entities in the ${this.name} collection.`, response);
    }).catch(err => {
      Log.error(`Failed to group the entities in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Counts entities in a collection. A query can be optionally provided to count
   * a subset of entities in a collection or omitted to count all the entities
   * in a collection. A promise will be returned that will be resolved with the count
   * or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to count a subset of entities.
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the cache.
   * @return  {Promise}                                                         Promise
   */
  count(query, options = {}) {
    Log.debug(`Counting the number of entities in the ${this.name} collection.`, query);

    options = assign({
      force: false
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this._pathname}/_count`
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute();
    }).then(response => {
      const result = {
        cache: response.data
      };

      result.networkPromise = this.syncCount().then(count => {
        if (count > 0) {
          return this.push().then(() => this.syncCount());
        }

        return count;
      }).then(count => {
        if (count > 0) {
          throw new KinveyError(`Unable to load data from the network. There are ${count} entities that need ` +
           'to be synced before data is loaded from the network.');
        }

        return super.count(query, options);
      });

      return result;
    });

    promise.then(response => {
      Log.info(`Counted the number of entities in the ${this.name} collection.`, response);
    }).catch(err => {
      Log.error(`Failed to count the number of entities in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Retrieves a single entity in a collection by id. A promise will be returned that will
   * be resolved with the entity or rejected with an error.
   *
   * @param   {string}                id                                        Document Id
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the cache.
   * @return  {Promise}                                                         Promise
   */
  findById(id, options = {}) {
    if (!id) {
      Log.warn('No id was provided to retrieve an entity.', id);
      return Promise.resolve(null);
    }

    Log.debug(`Retrieving the entity in the ${this.name} collection with id = ${id}.`);

    options = assign({
      force: false,
      useDeltaFetch: true
    }, options);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this._pathname}/${id}`
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute();
    }).then(response => {
      const result = {
        cache: response.data
      };

      result.networkPromise = this.syncCount().then(count => {
        if (count > 0) {
          return this.push().then(() => this.syncCount());
        }

        return count;
      }).then(count => {
        if (count > 0) {
          throw new KinveyError(`Unable to load data from the network. There are ${count} entities that need ` +
           'to be synced before data is loaded from the network.');
        }

        if (options.useDeltaFetch) {
          const request = new DeltaFetchRequest({
            method: HttpMethod.GET,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this._pathname}/${id}`
            }),
            properties: options.properties,
            timeout: options.timeout,
            client: this.client
          });
          return request.execute().then(response => response.data);
        }

        return super.findById(id, options);
      }).then(data => this._cache(data)).catch(error => {
        if (error instanceof NotFoundError) {
          const request = new LocalRequest({
            method: HttpMethod.DELETE,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this._pathname}/${id}`
            }),
            properties: options.properties,
            timeout: options.timeout,
            client: this.client
          });
          return request.execute().then(() => {
            throw error;
          });
        }

        throw error;
      });

      return result;
    });

    promise.then(response => {
      Log.info(`Retrieved the entity in the ${this.name} collection with id = ${id}.`, response);
    }).catch(error => {
      Log.error(`Failed to retrieve the entity in the ${this.name} collection with id = ${id}.`, error);
    });

    return promise;
  }

  /**
   * Save a entity or an array of entities to a collection. A promise will be returned that
   * will be resolved with the saved entity/entities or rejected with an error.
   *
   * @param   {Object|Array}          entities                                  Entity or entities to save.
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data saved
   *                                                                            in the cache.
   * @return  {Promise}                                                         Promise
   */
  save(entity, options = {}) {
    if (!entity) {
      Log.warn('No entity was provided to be saved.', entity);
      return Promise.resolve(null);
    }

    Log.debug(`Saving the entity(s) to the ${this.name} collection.`, entity);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.POST,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname
        }),
        properties: options.properties,
        data: entity,
        timeout: options.timeout,
        client: this.client
      });

      if (entity[idAttribute]) {
        request.method = HttpMethod.PUT;
        request.url = url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this._pathname}/${entity[idAttribute]}`
        });
      }

      return request.execute();
    }).then(response => {
      const promise = this._sync(response.data, options).then(() => {
        const data = isArray(response.data) ? response.data : [response.data];
        const ids = Object.keys(keyBy(data, idAttribute));
        const query = new Query().contains(idAttribute, ids);
        return this.push(query, options);
      }).then(pushResult => {
        const success = pushResult.success;
        const entities = map(success, successItem => successItem.entity);
        return !isArray(entity) && entities.length === 1 ? entities[0] : entities;
      });
      return promise;
    });

    promise.then(response => {
      Log.info(`Saved the entity(s) to the ${this.name} collection.`, response);
    }).catch(err => {
      Log.error(`Failed to save the entity(s) to the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Remove entities in a collection. A query can be optionally provided to remove
   * a subset of entities in a collection or omitted to remove all entities in a
   * collection. A promise will be returned that will be resolved with a count of the
   * number of entities removed or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  remove(query, options = {}) {
    Log.debug(`Removing the entities in the ${this.name} collection.`, query);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.DELETE,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute();
    }).then(response => {
      const promise = this._sync(response.data.entities, options).then(() => {
        const query = new Query().contains(idAttribute, []);
        return this.push(query, options);
      }).then(() => response.data);
      return promise;
    });

    promise.then(response => {
      Log.info(`Removed the entities in the ${this.name} collection.`, response);
    }).catch(err => {
      Log.error(`Failed to remove the entities in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Remove an entity in a collection. A promise will be returned that will be
   * resolved with a count of the number of entities removed or rejected with an error.
   *
   * @param   {string}                id                                        Document Id
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  removeById(id, options = {}) {
    if (!id) {
      Log.warn('No id was provided to be removed.', id);
      return Promise.resolve(null);
    }

    Log.debug(`Removing an entity in the ${this.name} collection with id = ${id}.`);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.DELETE,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this._pathname}/${id}`
        }),
        properties: options.properties,
        authType: AuthType.Default,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute();
    }).then(response => {
      const promise = this._sync(response.data.entities, options).then(() => {
        const query = new Query().contains(idAttribute, [id]);
        return this.push(query, options);
      }).then(() => response.data);
      return promise;
    });

    promise.then(response => {
      Log.info(`Removed the entity in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      Log.error(`Failed to remove the entity in the ${this.name} collection with id = ${id}.`, err);
    });

    return promise;
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
  push(query, options = {}) {
    if (!this.isSyncEnabled()) {
      return Promise.reject(new KinveyError('Sync is disabled.'));
    }

    if (!(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    query.contains(idAttribute, [this.name]);
    return this.client.syncManager.execute(query, options);
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
  pull(query, options = {}) {
    const promise = this.syncCount(null, options).then(count => {
      if (count > 0) {
        throw new KinveyError('Unable to pull data. You must push the pending sync items first.',
          'Call store.push() to push the pending sync items before you pull new data.');
      }

      return this.find(query, options);
    }).then(result => result.networkPromise);
    return promise;
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
  sync(query, options = {}) {
    const promise = this.push(null, options).then(pushResponse => {
      const promise = this.pull(query, options).then(pullResponse => {
        const result = {
          push: pushResponse,
          pull: pullResponse
        };
        return result;
      });
      return promise;
    });
    return promise;
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

    query.contains(idAttribute, [this.name]);
    return this.client.syncManager.count(query, options);
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
  _cache(entities, options = {}) {
    const request = new LocalRequest({
      method: HttpMethod.PUT,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this._pathname
      }),
      properties: options.properties,
      data: entities,
      timeout: options.timeout,
      client: this.client
    });

    const promise = request.execute().then(response => response.data);
    return promise;
  }

  /**
   * Add entities to be pushed. A promise will be returned with null or rejected with an error.
   *
   * @param   {Object|Array}          entities                                  Entity(s) to add to the sync table.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  _sync(entities, options = {}) {
    if (!this.isSyncEnabled()) {
      return Promise.resolve(null);
    }

    return this.client.syncManager.notify(this.name, entities, options);
  }
}

export { CacheStore };
