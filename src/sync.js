import {
  KinveyRequestConfig,
  RequestMethod,
  AuthType,
  CacheRequest,
  NetworkRequest,
  DeltaFetchRequest
} from './request';
import { InsufficientCredentialsError, SyncError } from './errors';
import { Client } from './client';
import { Query } from './query';
import { Promise } from 'es6-promise';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
import map from 'lodash/map';
import result from 'lodash/result';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'kinvey_sync';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * @private
 * Enum for Sync Operations.
 */
const SyncOperation = {
  Create: RequestMethod.POST,
  Update: RequestMethod.PUT,
  Delete: RequestMethod.DELETE
};
Object.freeze(SyncOperation);
export { SyncOperation };

export class SyncManager {
  constructor(collection, options = {}) {
    if (!collection) {
      throw new SyncError('A collection is required.');
    }

    if (!isString(collection)) {
      throw new SyncError('Collection must be a string.');
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
   * Pathname used to send sync requests.
   *
   * @return {String} sync pathname
   */
  get pathname() {
    return `/${appdataNamespace}/${this.client.appKey}/${syncCollectionName}`;
  }

  /**
   * Pathname used to send backend requests.
   *
   * @return {String} sync pathname
   */
  get backendPathname() {
    return `/${appdataNamespace}/${this.client.appKey}/${this.collection}`;
  }

  async find(query = new Query(), options = {}) {
    let syncEntities = [];

    if (!(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    query.equalTo('collection', this.collection);

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

    // Return the length of sync entities
    return syncEntities;
  }

  /**
   * Count the number of entities that are waiting to be synced. A query can be
   * provided to only count a subset of entities.
   *
   * @param   {Query}         [query]                     Query
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   */
  async count(query = new Query(), options = {}) {
    const syncEntities = await this.find(query, options);

    // Return the length of sync entities
    return syncEntities.length;
  }

  async addCreateOperation(entities, options = {}) {
    return this.addOperation(SyncOperation.Create, entities, options);
  }

  async addUpdateOperation(entities, options = {}) {
    return this.addOperation(SyncOperation.Update, entities, options);
  }

  async addDeleteOperation(entities, options = {}) {
    return this.addOperation(SyncOperation.Delete, entities, options);
  }

  async addOperation(operation = SyncOperation.Create, entities, options = {}) {
    let singular = false;

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

      // Find an existing sync operation for the entity
      const query = new Query().equalTo('entityId', id);
      const findConfig = new KinveyRequestConfig({
        method: RequestMethod.GET,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });
      const findRequest = new CacheRequest(findConfig);
      const response = await findRequest.execute();
      const syncEntities = response.data;
      const syncEntity = syncEntities.length === 1
        ? syncEntities[0]
        : { collection: this.collection, state: {}, entityId: id };

      // Update the state
      syncEntity.state = syncEntity.state || {};
      syncEntity.state.method = operation;

      // Send a request to save the sync entity
      const request = new CacheRequest({
        method: RequestMethod.PUT,
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

  async pull(query, options = {}) {
    // Check that the query is valid
    if (query && !(query instanceof Query)) {
      throw new SyncError('Invalid query. It must be an instance of the Query class.');
    }

    let count = await this.count();

    // Attempt to push any pending sync data before fetching from the network.
    if (count > 0) {
      await this.push();
      count = await this.count();
    }

    // Throw an error if there are still items that need to be synced
    if (count > 0) {
      throw new SyncError('Unable to pull data from the network.'
        + ` There are ${count} entities that need`
        + ' to be synced before data is loaded from the network.');
    }

    const config = new KinveyRequestConfig({
      method: RequestMethod.GET,
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.backendPathname,
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
    const networkEntities = response.data;

    // Save network entities to cache
    const saveConfig = new KinveyRequestConfig({
      method: RequestMethod.PUT,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.backendPathname,
        query: options.query
      }),
      properties: options.properties,
      body: networkEntities,
      timeout: options.timeout
    });
    const saveRequest = new CacheRequest(saveConfig);
    await saveRequest.execute();

    // Return the network entities
    return networkEntities;
  }

  /*
   * Sync entities with the network. A query can be provided to
   * sync a subset of entities.
   *
   * @param   {Query}         [query]                     Query
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   */
  async push(query, options = {}) {
    const batchSize = 100;
    let i = 0;

    // Get the pending sync items
    const syncEntities = await this.find(query);

    if (syncEntities.length > 0) {
      // Sync the entities in batches to prevent exhausting
      // available network connections
      const batchSync = async (syncResults) => {
        const promise = new Promise(async resolve => {
          const batch = syncEntities.slice(i, i + batchSize);
          i += batchSize;

          // Get the results of syncing all of the entities
          const results = await Promise.all(map(batch, syncEntity => {
            const originalId = syncEntity.entityId;
            const method = syncEntity.state.method;

            if (method === RequestMethod.DELETE) {
              // Remove the entity from the network.
              const request = new NetworkRequest({
                method: RequestMethod.DELETE,
                authType: AuthType.Default,
                url: url.format({
                  protocol: this.client.protocol,
                  host: this.client.host,
                  pathname: `${this.backendPathname}/${originalId}`
                }),
                properties: options.properties,
                timeout: options.timeout,
                client: this.client
              });
              return request.execute()
                .then(() => {
                  // Remove the sync entity
                  const config = new KinveyRequestConfig({
                    method: RequestMethod.DELETE,
                    url: url.format({
                      protocol: this.client.protocol,
                      host: this.client.host,
                      pathname: `${this.pathname}/${syncEntity[idAttribute]}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  const request = new CacheRequest(config);
                  return request.execute();
                })
                .then(() => {
                  // Return the result
                  const result = { _id: originalId };
                  return result;
                })
                .catch(async error => {
                  // If the credentials used to authenticate this request are
                  // not authorized to run the operation
                  if (error instanceof InsufficientCredentialsError) {
                    try {
                      // Get the original entity
                      const getNetworkRequest = new NetworkRequest({
                        method: RequestMethod.GET,
                        authType: AuthType.Default,
                        url: url.format({
                          protocol: this.client.protocol,
                          host: this.client.host,
                          pathname: `${this.backendPathname}/${originalId}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        client: this.client
                      });
                      const originalEntity = await getNetworkRequest.execute().then(response => response.data);

                      // Update the cache with the original entity
                      const putCacheRequest = new CacheRequest({
                        method: RequestMethod.PUT,
                        url: url.format({
                          protocol: this.client.protocol,
                          host: this.client.host,
                          pathname: `${this.backendPathname}/${originalId}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        body: originalEntity
                      });
                      await putCacheRequest.execute();

                      // Clear the item from the sync table
                      const deleteSyncRequest = new CacheRequest({
                        method: RequestMethod.DELETE,
                        url: url.format({
                          protocol: this.client.protocol,
                          host: this.client.host,
                          pathname: `${this.pathname}/${syncEntity[idAttribute]}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout
                      });
                      await deleteSyncRequest.execute();
                    } catch (error) {
                      // Throw away the error
                    }
                  }

                  // Return the result of the sync operation.
                  return {
                    _id: originalId,
                    error: error
                  };
                });
            } else if (method === RequestMethod.POST || method === RequestMethod.PUT) {
              // Get the entity from cache
              const config = new KinveyRequestConfig({
                method: RequestMethod.GET,
                url: url.format({
                  protocol: this.client.protocol,
                  host: this.client.host,
                  pathname: `${this.backendPathname}/${originalId}`
                }),
                properties: options.properties,
                timeout: options.timeout
              });
              const request = new CacheRequest(config);
              return request.execute().then(response => {
                const entity = response.data;

                // Save the entity to the network.
                const request = new NetworkRequest({
                  method: method,
                  authType: AuthType.Default,
                  url: url.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: `${this.backendPathname}/${originalId}`
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  body: entity,
                  client: this.client
                });

                // If the entity was created locally then delete the autogenerated _id,
                // send a POST request, and update the url.
                if (method === RequestMethod.POST) {
                  delete entity[idAttribute];
                  request.method = RequestMethod.POST;
                  request.url = url.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.backendPathname
                  });
                  request.body = entity;
                }

                return request.execute()
                  .then(response => response.data)
                  .then(async entity => {
                    // Remove the sync entity
                    const deleteConfig = new KinveyRequestConfig({
                      method: RequestMethod.DELETE,
                      url: url.format({
                        protocol: this.client.protocol,
                        host: this.client.host,
                        pathname: `${this.pathname}/${syncEntity[idAttribute]}`
                      }),
                      properties: options.properties,
                      timeout: options.timeout
                    });
                    const deleteRequest = new CacheRequest(deleteConfig);
                    await deleteRequest.execute();

                    // Save the result of the network request locally.
                    const putCacheRequest = new CacheRequest({
                      method: RequestMethod.PUT,
                      url: url.format({
                        protocol: this.client.protocol,
                        host: this.client.host,
                        pathname: `${this.backendPathname}/${entity[idAttribute]}`
                      }),
                      properties: options.properties,
                      timeout: options.timeout,
                      body: entity
                    });
                    entity = await putCacheRequest.execute().then(response => response.data);

                    // Remove the original entity if it was created on the device
                    // using the SDK.
                    if (method === RequestMethod.POST) {
                      const deleteCacheRequest = new CacheRequest({
                        method: RequestMethod.DELETE,
                        url: url.format({
                          protocol: this.client.protocol,
                          host: this.client.host,
                          pathname: `${this.backendPathname}/${originalId}`
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
                    // If the credentials used to authenticate this request are
                    // not authorized to run the operation then just remove the entity
                    // from the sync table
                    if (error instanceof InsufficientCredentialsError) {
                      try {
                        // Try and reset the state of the entity if the entity
                        // is not local
                        if (method !== RequestMethod.POST) {
                          // Get the original entity
                          const getNetworkRequest = new NetworkRequest({
                            method: RequestMethod.GET,
                            authType: AuthType.Default,
                            url: url.format({
                              protocol: this.client.protocol,
                              host: this.client.host,
                              pathname: `${this.backendPathname}/${originalId}`
                            }),
                            properties: options.properties,
                            timeout: options.timeout,
                            client: this.client
                          });
                          const originalEntity = await getNetworkRequest.execute().then(response => response.data);

                          // Update the cache with the original entity
                          const putCacheRequest = new CacheRequest({
                            method: RequestMethod.PUT,
                            url: url.format({
                              protocol: this.client.protocol,
                              host: this.client.host,
                              pathname: `${this.backendPathname}/${originalId}`
                            }),
                            properties: options.properties,
                            timeout: options.timeout,
                            body: originalEntity
                          });
                          await putCacheRequest.execute();

                          // Clear the item from the sync table
                          const deleteSyncRequest = new CacheRequest({
                            method: RequestMethod.DELETE,
                            url: url.format({
                              protocol: this.client.protocol,
                              host: this.client.host,
                              pathname: `${this.pathname}/${syncEntity[idAttribute]}`
                            }),
                            properties: options.properties,
                            timeout: options.timeout
                          });
                          await deleteSyncRequest.execute();
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
              });
            }

            return {
              _id: originalId,
              entity: undefined,
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

      // Return the result
      return batchSync([]);
    }

    // Return an empty array
    return [];
  }

  async sync(query, options = {}) {
    const push = await this.push(null, options);
    const pull = await this.pull(query, options);
    return {
      push: push,
      pull: pull
    };
  }

  /**
   * Clear the sync table. A query can be provided to
   * only clear a subet of the sync table.
   *
   * @param   {Query}         [query]                     Query
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   */
  clear(query = new Query(), options = {}) {
    if (!(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    query.equalTo('collection', this.collection);
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
