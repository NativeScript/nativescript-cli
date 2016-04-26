import Promise from 'babybird';
import { HttpMethod, AuthType } from './enums';
import { InsufficientCredentialsError, NotFoundError, KinveyError, SyncError } from './errors';
import { Metadata } from './metadata';
import { LocalRequest } from './requests/local';
import { NetworkRequest } from './requests/network';
import { Client } from './client';
import url from 'url';
import map from 'lodash/map';
import reduce from 'lodash/reduce';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import mapSeries from 'async/mapSeries';
import parallel from 'async/parallel';
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
    // Get all sync entities
    const request = new LocalRequest({
      method: HttpMethod.GET,
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
    const syncEntities = await request.execute().then(response => response.data);

    // Add up the size of each sync entity and return the result
    return reduce(syncEntities, (sum, syncEntity) => sum + syncEntity.size, 0);
  }

  /**
   * Add entities to the sync table. You can add a single entity or an array
   * of entities. Each entity must have an _id.
   *
   * @param   {String}        name                        Collection name for entities.
   * @param   {Object|Array}  entiies                     Entities to add to the sync table.
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   *
   * @example
   * var entities = [{
   *   _id: '1',
   *   prop: 'value'
   * }];
   * var sync = new Sync();
   * var promise = sync.notify('collectionName', entities).then(function(entities) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  async notify(name, entities, options = {}) {
    let singular = false;

    // Check that a name was provided
    if (!name) {
      throw new KinveyError('A name for a collection must be provided to add entities to the sync table.');
    }

    // Just return null if nothing was provided
    // to be added to the sync table
    if (!entities) {
      return null;
    }

    // Get the sync entity for the collection
    const getRequest = new LocalRequest({
      method: HttpMethod.GET,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/${name}`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });

    let syncEntity = {
      _id: name,
      entities: {},
      size: 0
    };

    try {
      syncEntity = await getRequest.execute().then(response => response.data);
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }

    // Cast entities to an array
    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    // Loop through all the entities and update
    // the sync entity
    forEach(entities, entity => {
      const id = entity[idAttribute];

      if (!id) {
        throw new SyncError('An entity is missing an _id. All entities must have an _id in order to be ' +
          'added to the sync table.', entity);
      }

      if (!syncEntity.entities.hasOwnProperty(id)) {
        syncEntity.size = syncEntity.size + 1;
      }

      syncEntity.entities[id] = {};
    });

    // Update the sync entity in the sync table
    const putRequest = new LocalRequest({
      method: HttpMethod.PUT,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname
      }),
      properties: options.properties,
      timeout: options.timeout,
      data: syncEntity,
      client: this.client
    });
    await putRequest.execute();

    // Return the entities that were added to the sync table
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
   * var promise = sync.execute().then(function(response) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  async execute(query, options = {}) {
    // Make a request for the pending sync entities
    const request = new LocalRequest({
      method: HttpMethod.GET,
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
    const syncEntities = await request.execute().then(response => response.data);

    return new Promise((resolve, reject) => {
      // Sync each individual entity in series
      mapSeries(syncEntities, async (syncEntity, callback) => {
        const collectionName = syncEntity[idAttribute];
        let syncSize = syncEntity.size;
        const entities = syncEntity.entities;
        const ids = Object.keys(entities);
        const syncResult = { collection: collectionName, success: [], error: [] };
        const batchSize = 100;
        let i = 0;

        // Sync the entities in batches to prevent exhausting
        // available network connections
        const batchSync = async () => {
          const promise = new Promise(async (resolve, reject) => {
            const batchIds = ids.slice(i, i + batchSize);
            i += batchSize;
            const save = [];
            const remove = [];

            // Look up then entities by id. If the entity is found
            // then peform an POST/PUT operation to the Network. If the
            // entity is not found then perform a DELETE operation
            // to the Network.
            await Promise.all(map(batchIds, async id => {
              try {
                const request = new LocalRequest({
                  method: HttpMethod.GET,
                  url: url.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${id}`
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                const entity = await request.execute().then(response => response.data);
                return save.push(entity);
              } catch (error) {
                if (error instanceof NotFoundError) {
                  return remove.push(id);
                }

                throw error;
              }
            }));

            // Execute PUT/POST operations and DELETE operations
            // in parallel
            parallel({
              saved: async callback => {
                const saved = await Promise.all(map(save, async entity => {
                  const metadata = new Metadata(entity);
                  const originalId = entity[idAttribute];
                  delete entity[kmdAttribute];

                  try {
                    // Save the entity to the network.
                    const putNetworkRequest = new NetworkRequest({
                      method: HttpMethod.PUT,
                      authType: AuthType.Default,
                      url: url.format({
                        protocol: this.client.protocol,
                        host: this.client.host,
                        pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${originalId}`
                      }),
                      properties: options.properties,
                      timeout: options.timeout,
                      data: entity,
                      client: this.client
                    });

                    if (metadata.isLocal()) {
                      delete entity[idAttribute];
                      request.method = HttpMethod.POST;
                      request.url = url.format({
                        protocol: this.client.protocol,
                        host: this.client.host,
                        pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}`
                      });
                      request.data = entity;
                    }

                    entity = await putNetworkRequest.execute().then(response => response.data);

                    // Save the result of the network request locally.
                    const putLocalRequest = new LocalRequest({
                      method: HttpMethod.PUT,
                      url: url.format({
                        protocol: this.client.protocol,
                        host: this.client.host,
                        pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${entity[idAttribute]}`
                      }),
                      properties: options.properties,
                      timeout: options.timeout,
                      data: entity,
                      client: this.client
                    });
                    entity = putLocalRequest.execute().then(response => response.data);

                    // Remove the original entity if it was created on the device
                    // using the SDK.
                    if (metadata.isLocal()) {
                      const deleteLocalRequest = new LocalRequest({
                        method: HttpMethod.DELETE,
                        url: url.format({
                          protocol: this.client.protocol,
                          host: this.client.host,
                          pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${originalId}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        client: this.client
                      });
                      await deleteLocalRequest.execute();
                    }

                    // Reduce the syncSize by 1 and delete the entry for the
                    // entity.
                    syncSize = syncSize - 1;
                    delete entities[originalId];

                    // Return the result of the sync operation.
                    return {
                      _id: originalId,
                      entity: entity
                    };
                  } catch (error) {
                    // If the credentials used to authenticate this request are
                    // not authorized to run the operation then just remove the entity
                    // from the sync table
                    if (error instanceof InsufficientCredentialsError) {
                      try {
                        // Try and reset the state of the entity if the entity
                        // is not local
                        if (!metadata.isLocal()) {
                          const getNetworkRequest = new NetworkRequest({
                            method: HttpMethod.GET,
                            authType: AuthType.Default,
                            url: url.format({
                              protocol: this.client.protocol,
                              host: this.client.host,
                              pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${originalId}`
                            }),
                            properties: options.properties,
                            timeout: options.timeout,
                            client: this.client
                          });
                          const originalEntity = await getNetworkRequest.execute().then(response => response.data);
                          const putLocalRequest = new LocalRequest({
                            method: HttpMethod.PUT,
                            url: url.format({
                              protocol: this.client.protocol,
                              host: this.client.host,
                              pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${originalId}`
                            }),
                            properties: options.properties,
                            timeout: options.timeout,
                            data: originalEntity,
                            client: this.client
                          });
                          await putLocalRequest.execute();
                        }
                      } catch (error) {
                        if (!(error instanceof NotFoundError)) {
                          throw error;
                        }
                      }

                      // Reduce the syncSize by 1 and delete the entry for the
                      // entity.
                      syncSize = syncSize - 1;
                      delete entities[originalId];
                    }

                    // Return the result of the sync operation.
                    return {
                      _id: originalId,
                      error: error
                    };
                  }
                }));

                // Call the callback with the result of the saved operations.
                callback(null, saved);
              },
              removed: async callback => {
                const removed = await Promise.all(map(remove, async id => {
                  try {
                    // Remove the entity from the network.
                    const request = new NetworkRequest({
                      method: HttpMethod.DELETE,
                      authType: AuthType.Default,
                      url: url.format({
                        protocol: this.client.protocol,
                        host: this.client.host,
                        pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${id}`
                      }),
                      properties: options.properties,
                      timeout: options.timeout,
                      client: this.client
                    });
                    await request.execute();

                    // Reduce the syncSize by 1 and delete the entry for the
                    // entity.
                    syncSize = syncSize - 1;
                    delete entities[id];

                    // Return the result of the sync operation.
                    return {
                      _id: id
                    };
                  } catch (error) {
                    // If the entity was not found on the network then
                    // we should just remove the entity from the sync table.
                    // This is the result that was intended from the
                    // sync operation.
                    if (error instanceof NotFoundError) {
                      // Reduce the syncSize by 1 and delete the entry for the
                      // entity.
                      syncSize = syncSize - 1;
                      delete entities[id];
                    }

                    // If the credentials used to authenticate this request are
                    // not authorized to run the operation
                    if (error instanceof InsufficientCredentialsError) {
                      try {
                        // Try and reset the state of the entity
                        const getNetworkRequest = new NetworkRequest({
                          method: HttpMethod.GET,
                          authType: AuthType.Default,
                          url: url.format({
                            protocol: this.client.protocol,
                            host: this.client.host,
                            pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${id}`
                          }),
                          properties: options.properties,
                          timeout: options.timeout,
                          client: this.client
                        });
                        const originalEntity = await getNetworkRequest.execute().then(response => response.data);
                        const putLocalRequest = new LocalRequest({
                          method: HttpMethod.PUT,
                          url: url.format({
                            protocol: this.client.protocol,
                            host: this.client.host,
                            pathname: `/${appdataNamespace}/${this.client.appKey}/${collectionName}/${id}`
                          }),
                          properties: options.properties,
                          timeout: options.timeout,
                          data: originalEntity,
                          client: this.client
                        });
                        await putLocalRequest.execute();
                      } catch (error) {
                        if (!(error instanceof NotFoundError)) {
                          throw error;
                        }
                      }

                      // Reduce the syncSize by 1 and delete the entry for the
                      // entity.
                      syncSize = syncSize - 1;
                      delete entities[id];
                    }

                    // Return the result of the sync operation.
                    return {
                      _id: id,
                      error: error
                    };
                  }
                }));

                // Call the callback with the result of the
                // remove operations.
                callback(null, removed);
              }
            }, async (error, { saved, removed }) => {
              if (error) {
                return reject(error);
              }

              const result = {
                collection: collectionName,
                success: [],
                error: []
              };

              forEach(saved, savedResult => {
                if (savedResult.error) {
                  result.error.push(savedResult);
                } else {
                  result.success.push(savedResult);
                }
              });

              forEach(removed, removedResult => {
                if (removedResult.error) {
                  result.error.push(removedResult);
                } else {
                  result.success.push(removedResult);
                }
              });

              syncResult.success = syncResult.success.concat(result.success);
              syncResult.error = syncResult.error.concat(result.error);

              if (i < ids.length) {
                return resolve(await batchSync());
              }

              return resolve(syncResult);
            });
          });
          return promise;
        };

        try {
          // Get the result of sync.
          const result = await batchSync();

          // Update the sync table.
          syncEntity.size = syncSize;
          syncEntity.entities = entities;
          const request = new LocalRequest({
            method: HttpMethod.PUT,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this.pathname}/${syncEntity[idAttribute]}`
            }),
            properties: options.properties,
            timeout: options.timeout,
            data: syncEntity,
            client: this.client
          });
          await request.execute();

          // Call the callback with the result of sync.
          callback(null, result);
        } catch (error) {
          callback(error);
        }
      }, (error, results) => {
        if (error) {
          return reject(error);
        }

        // Return the results of sync.
        return results.length === 1 ? resolve(results[0]) : resolve(results);
      });
    });
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
    const request = new LocalRequest({
      method: HttpMethod.DELETE,
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
    return request.execute();
  }
}
