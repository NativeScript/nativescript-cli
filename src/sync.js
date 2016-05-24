import { RequestMethod, AuthType } from './requests/request';
import { InsufficientCredentialsError, NotFoundError, SyncError } from './errors';
import { Metadata } from './metadata';
import CacheRequest from './requests/cache';
import { NetworkRequest } from './requests/network';
import Client from './client';
import { getSyncKey, setSyncKey } from './utils/storage';
import url from 'url';
import map from 'lodash/map';
import isArray from 'lodash/isArray';
import orderBy from 'lodash/orderBy';
import sortedUniqBy from 'lodash/sortedUniqBy';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'kinvey_sync';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

export default class Sync {
  constructor() {
    /**
     * @private
     * @type {Client}
     */
    this.client = Client.sharedInstance();
  }

  /**
   * Pathname used to send sync requests.
   *
   * @return {String} sync pathname
   */
  get pathname() {
    return `/${appdataNamespace}/${this.client.appKey}/${syncCollectionName}`;
  }

  /**
   * Count the number of entities that are waiting to be synced. A query can be
   * provided to only count a subset of entities.
   *
   * @param   {Query}         [query]                     Query
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   *
   * @example
   * var sync = new Sync();
   * var promise = sync.count().then(function(count) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  async count(query, options = {}) {
    let syncEntities = [];

    // Get all sync entities
    const request = new CacheRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname
      }),
      properties: options.properties,
      query: query,
      timeout: options.timeout,
      client: this.client
    });
    syncEntities = await request.execute().then(response => response.data);

    // Filter the sync entities so that we only perform
    // one sync operation per unique entity.
    syncEntities = orderBy(syncEntities, 'key', ['desc']);
    syncEntities = sortedUniqBy(syncEntities, syncEntity => syncEntity.entity[idAttribute]);

    // Return the length of sync entities
    return syncEntities.length;
  }

  /**
   * Save a sync entity to the sync table with a POST method.
   *
   * @param   {String}        collection                  Collection name for the entity.
   * @param   {Object|Array}  entity                      Entity to add to the sync table.
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   *
   * @example
   * var entity = {
   *   _id: '1',
   *   prop: 'value'
   * };
   * var sync = new Sync();
   * var promise = sync.save('collectionName', entities).then(function(entity) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  async addCreateOperation(collection, entities, options = {}) {
    let singular = false;

    // Check that a name was provided
    if (!collection) {
      throw new SyncError('A name for a collection must be provided to add entities to the sync table.');
    }

    // Cast the entities to an array
    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    // Process the array of entities
    await Promise.all(map(entities, async entity => {
      // Just return null if nothing was provided
      // to be added to the sync table
      if (!entity) {
        return null;
      }

      // Validate that the entity has an id
      const id = entity[idAttribute];
      if (!id) {
        throw new SyncError('An entity is missing an _id. All entities must have an _id in order to be ' +
          'added to the sync table.', entity);
      }

      // Get the sync key, increment it by 1 and save
      let key = getSyncKey(this.client) || 0;
      key += 1;
      setSyncKey(this.client, key);

      // Create the sync entity
      const syncEntity = {
        key: key,
        collection: collection,
        state: {
          method: RequestMethod.POST
        },
        entity: entity
      };

      // Validate that the entity has an id
      if (!id) {
        throw new SyncError('An entity is missing an _id. All entities must have an _id in order to be ' +
          'added to the sync table.', entity);
      }

      // Send a request to save the sync entity
      const request = new CacheRequest({
        method: RequestMethod.POST,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname
        }),
        properties: options.properties,
        body: syncEntity,
        timeout: options.timeout
      });
      return request.execute();
    }));

    // Return the entity
    return singular ? entities[0] : entities;
  }

  async addUpdateOperation(collection, entities, options = {}) {
    let singular = false;

    // Check that a name was provided
    if (!collection) {
      throw new SyncError('A name for a collection must be provided to add entities to the sync table.');
    }

    // Cast the entities to an array
    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    // Process the array of entities
    await Promise.all(map(entities, async entity => {
      // Just return null if nothing was provided
      // to be added to the sync table
      if (!entity) {
        return null;
      }

      // Validate that the entity has an id
      const id = entity[idAttribute];
      if (!id) {
        throw new SyncError('An entity is missing an _id. All entities must have an _id in order to be ' +
          'added to the sync table.', entity);
      }

      // Get the sync key, increment it by 1 and save
      let key = getSyncKey(this.client) || 0;
      key += 1;
      setSyncKey(this.client, key);

      // Create the sync entity
      const syncEntity = {
        key: key,
        collection: collection,
        state: {
          method: RequestMethod.PUT
        },
        entity: entity
      };

      // Validate that the entity has an id
      if (!id) {
        throw new SyncError('An entity is missing an _id. All entities must have an _id in order to be ' +
          'added to the sync table.', entity);
      }

      // Send a request to save the sync entity
      const request = new CacheRequest({
        method: RequestMethod.POST,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname
        }),
        properties: options.properties,
        body: syncEntity,
        timeout: options.timeout
      });
      return request.execute();
    }));

    // Return the entity
    return singular ? entities[0] : entities;
  }

  /**
   * Save a sync entity to the sync table with a DELETE method.
   *
   * @param   {String}        collection                  Collection name for the entity.
   * @param   {Object|Array}  entity                      Entity to add to the sync table.
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   *
   * @example
   * var entity = {
   *   _id: '1',
   *   prop: 'value'
   * };
   * var sync = new Sync();
   * var promise = sync.remove('collectionName', entities).then(function(entity) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  async addDeleteOperation(collection, entities, options = {}) {
    let singular = false;

    // Check that a name was provided
    if (!collection) {
      throw new SyncError('A name for a collection must be provided to add entities to the sync table.');
    }

    // Cast the entities to an array
    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    // Process the array of entities
    await Promise.all(map(entities, async entity => {
      // Just return null if nothing was provided
      // to be added to the sync table
      if (!entity) {
        return null;
      }

      // Validate that the entity has an id
      const id = entity[idAttribute];
      if (!id) {
        throw new SyncError('An entity is missing an _id. All entities must have an _id in order to be ' +
          'added to the sync table.', entity);
      }

      // Get the sync key, increment it by 1 and save
      let key = getSyncKey(this.client) || 0;
      key += 1;
      setSyncKey(this.client, key);

      // Create the sync entity
      const syncEntity = {
        key: key,
        collection: collection,
        state: {
          method: RequestMethod.DELETE
        },
        entity: entity
      };

      // Validate that the entity has an id
      if (!id) {
        throw new SyncError('An entity is missing an _id. All entities must have an _id in order to be ' +
          'added to the sync table.', entity);
      }

      // Send a request to save the sync entity
      const request = new CacheRequest({
        method: RequestMethod.POST,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname
        }),
        properties: options.properties,
        body: syncEntity,
        timeout: options.timeout
      });
      return request.execute();
    }));

    // Return the entity
    return singular ? entities[0] : entities;
  }

  /**
   * Sync entities with the network. A query can be provided to
   * sync a subset of entities.
   *
   * @param   {Query}         [query]                     Query
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   *
   * @example
   * var sync = new Sync();
   * var promise = sync.push().then(function(response) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  async push(query, options = {}) {
    let syncResults = [];
    const failedSyncEntities = [];
    const batchSize = 100;
    let i = 0;

    // Make a request for the pending sync entities
    const deleteRequest = new CacheRequest({
      method: RequestMethod.DELETE,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname
      }),
      properties: options.properties,
      query: query,
      timeout: options.timeout
    });
    const response = await deleteRequest.execute();
    let syncEntities = response.data;

    if (syncEntities.length > 0) {
      // Filter the sync entities so that we only perform
      // one sync operation per unique entity.
      syncEntities = orderBy(syncEntities, 'key', ['desc']);
      syncEntities = sortedUniqBy(syncEntities, syncEntity => syncEntity.entity[idAttribute]);

      // Sync the entities in batches to prevent exhausting
      // available network connections
      const batchSync = async (syncResults) => {
        const promise = new Promise(async resolve => {
          const batch = syncEntities.slice(i, i + batchSize);
          i += batchSize;

          // Get the results of syncing all of the entities
          const results = await Promise.all(map(batch, syncEntity => {
            const collection = syncEntity.collection;
            const entity = syncEntity.entity;
            const metadata = new Metadata(entity);
            const originalId = entity[idAttribute];
            const method = syncEntity.state.method;

            if (method === RequestMethod.DELETE) {
              // Remove the entity from the network.
              const request = new NetworkRequest({
                method: RequestMethod.DELETE,
                authType: AuthType.Default,
                url: url.format({
                  protocol: this.client.protocol,
                  host: this.client.host,
                  pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}/${originalId}`
                }),
                properties: options.properties,
                timeout: options.timeout,
                client: this.client
              });
              return request.execute()
                .then(() => {
                  const result = { _id: originalId, entity: entity };
                  return result;
                })
                .catch(async error => {
                  if (!(error instanceof NotFoundError) || !(error instanceof InsufficientCredentialsError)) {
                    failedSyncEntities.push(syncEntity);
                  }

                  // If the credentials used to authenticate this request are
                  // not authorized to run the operation
                  if (error instanceof InsufficientCredentialsError) {
                    try {
                      // Try and reset the state of the entity
                      const getNetworkRequest = new NetworkRequest({
                        method: RequestMethod.GET,
                        authType: AuthType.Default,
                        url: url.format({
                          protocol: this.client.protocol,
                          host: this.client.host,
                          pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}/${originalId}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        client: this.client
                      });
                      const originalEntity = await getNetworkRequest.execute().then(response => response.data);
                      const putCacheRequest = new CacheRequest({
                        method: RequestMethod.PUT,
                        url: url.format({
                          protocol: this.client.protocol,
                          host: this.client.host,
                          pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}/${originalId}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        body: originalEntity
                      });
                      await putCacheRequest.execute();
                    } catch (error) {
                      // Throw away the error
                    }
                  }

                  // Return the result of the sync operation.
                  return {
                    _id: originalId,
                    entity: entity,
                    error: error
                  };
                });
            } else if (method === RequestMethod.POST || method === RequestMethod.PUT) {
              // Save the entity to the network.
              const request = new NetworkRequest({
                method: method,
                authType: AuthType.Default,
                url: url.format({
                  protocol: this.client.protocol,
                  host: this.client.host,
                  pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}/${originalId}`
                }),
                properties: options.properties,
                timeout: options.timeout,
                body: entity,
                client: this.client
              });

              // If the entity was created locally then delete the autogenerated _id,
              // send a POST request, and update the url.
              if (metadata.isLocal()) {
                delete entity[idAttribute];
                delete entity[kmdAttribute].local;
                request.method = RequestMethod.POST;
                request.url = url.format({
                  protocol: this.client.protocol,
                  host: this.client.host,
                  pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}`
                });
                request.body = entity;
              }

              return request.execute()
                .then(response => response.data)
                .then(async entity => {
                  // Save the result of the network request locally.
                  const putCacheRequest = new CacheRequest({
                    method: RequestMethod.PUT,
                    url: url.format({
                      protocol: this.client.protocol,
                      host: this.client.host,
                      pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}/${entity[idAttribute]}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout,
                    body: entity
                  });
                  entity = await putCacheRequest.execute().then(response => response.data);

                  // Remove the original entity if it was created on the device
                  // using the SDK.
                  if (metadata.isLocal()) {
                    const deleteCacheRequest = new CacheRequest({
                      method: RequestMethod.DELETE,
                      url: url.format({
                        protocol: this.client.protocol,
                        host: this.client.host,
                        pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}/${originalId}`
                      }),
                      properties: options.properties,
                      timeout: options.timeout
                    });
                    await deleteCacheRequest.execute();
                  }

                  // Return the result of the sync operation.
                  return {
                    _id: originalId,
                    entity: entity
                  };
                })
                .catch(async error => {
                  if (!(error instanceof InsufficientCredentialsError)) {
                    failedSyncEntities.push(syncEntity);
                  }

                  // If the credentials used to authenticate this request are
                  // not authorized to run the operation then just remove the entity
                  // from the sync table
                  if (error instanceof InsufficientCredentialsError) {
                    try {
                      // Try and reset the state of the entity if the entity
                      // is not local
                      if (!metadata.isLocal()) {
                        const getNetworkRequest = new NetworkRequest({
                          method: RequestMethod.GET,
                          authType: AuthType.Default,
                          url: url.format({
                            protocol: this.client.protocol,
                            host: this.client.host,
                            pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}/${originalId}`
                          }),
                          properties: options.properties,
                          timeout: options.timeout,
                          client: this.client
                        });
                        const originalEntity = await getNetworkRequest.execute().then(response => response.data);
                        const putCacheRequest = new CacheRequest({
                          method: RequestMethod.PUT,
                          url: url.format({
                            protocol: this.client.protocol,
                            host: this.client.host,
                            pathname: `/${appdataNamespace}/${this.client.appKey}/${collection}/${originalId}`
                          }),
                          properties: options.properties,
                          timeout: options.timeout,
                          body: originalEntity
                        });
                        await putCacheRequest.execute();
                      }
                    } catch (error) {
                      // Throw away the error
                    }
                  }

                  // Return the result of the sync operation.
                  return {
                    _id: originalId,
                    entity: entity,
                    error: error
                  };
                });
            }

            return {
              _id: originalId,
              entity: entity,
              error: new SyncError('Unable to sync the entity since the method was not recognized.', syncEntity)
            };
          }));

          // Concat the results
          syncResults = syncResults.concat(results);

          // Sync the remaining entities
          if (i < syncEntities.length) {
            return resolve(batchSync(syncResults));
          }

          // Resolve with the sync results
          return resolve(syncResults);
        });
        return promise;
      };

      // Get the result of sync.
      syncResults = await batchSync([]);

      // Add back the failed sync entities to the sync table
      if (failedSyncEntities.length > 0) {
        const putRequest = new CacheRequest({
          method: RequestMethod.PUT,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: this.pathname
          }),
          properties: options.properties,
          timeout: options.timeout,
          data: failedSyncEntities
        });
        await putRequest.execute();
      }
    }

    // Return the sync result
    return syncResults;
  }

  /**
   * Clear the sync table. A query can be provided to
   * only clear a subet of the sync table.
   *
   * @param   {Query}         [query]                     Query
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   *
   * @example
   * var sync = new Sync();
   * var promise = sync.clear().then(function(response) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  clear(query, options = {}) {
    const request = new CacheRequest({
      method: RequestMethod.DELETE,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname
      }),
      properties: options.properties,
      query: query,
      timeout: options.timeout
    });
    return request.execute();
  }
}
