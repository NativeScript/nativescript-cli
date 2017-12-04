import Promise from 'es6-promise';
import map from 'lodash/map';
import result from 'lodash/result';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import url from 'url';
import { KinveyRequest, RequestMethod, AuthType, CacheRequest, DeltaFetchRequest } from '../request';
import { SyncError } from '../errors';
import { isDefined } from '../utils';
import { Client } from '../client';
import { Query } from '../query';

const pushInProgress = new Map();

/**
 * @private
 * Enum for Sync Operations.
 */
export const SyncOperation = {
  Create: RequestMethod.POST,
  Update: RequestMethod.PUT,
  Delete: RequestMethod.DELETE
};
Object.freeze(SyncOperation);

/**
 * @private
 */
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
    return `/appdata/${this.client.appKey}/kinvey_sync`;
  }

  /**
   * Pathname used to send backend requests.
   *
   * @return {String} sync pathname
   */
  get backendPathname() {
    return `/appdata/${this.client.appKey}/${this.collection}`;
  }

  find(query, options = {}) {
    if (isDefined(query) && (query instanceof Query) === false) {
      query = new Query(result(query, 'toJSON', query));
    }

    const request = new CacheRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: this.backendPathname
      }),
      query: query,
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    return request.execute()
      .then(response => response.data)
      .then((entities) => {
        const syncQuery = new Query();
        syncQuery.equalTo('collection', this.collection);

        if (isDefined(query)) {
          syncQuery.contains('entityId', map(entities, entity => entity._id));
        }

        const request = new CacheRequest({
          method: RequestMethod.GET,
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: this.pathname
          }),
          properties: options.properties,
          query: syncQuery,
          timeout: options.timeout,
          client: this.client
        });
        return request.execute()
          .then(response => response.data);
      });
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
  count(query, options = {}) {
    return this.find(query, options)
      .then(entities => entities.length);
  }

  addCreateOperation(entities, options = {}) {
    return this.addOperation(SyncOperation.Create, entities, options);
  }

  addUpdateOperation(entities, options = {}) {
    return this.addOperation(SyncOperation.Update, entities, options);
  }

  addDeleteOperation(entities, options = {}) {
    return this.addOperation(SyncOperation.Delete, entities, options);
  }

  addOperation(operation = SyncOperation.Create, entities, options = {}) {
    let singular = false;

    // Cast the entities to an array
    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    // Process the array of entities
    return Promise.all(map(entities, (entity) => {
      // Just return null if nothing was provided
      // to be added to the sync table
      if (!entity) {
        return Promise.resolve(null);
      }

      // Validate that the entity has an id
      const id = entity._id;
      if (!id) {
        return Promise.reject(
          new SyncError('An entity is missing an _id. All entities must have an _id in order to be ' +
            'added to the sync table.', entity)
        );
      }

      // Find an existing sync operation for the entity
      const query = new Query().equalTo('entityId', id);
      const findRequest = new CacheRequest({
        method: RequestMethod.GET,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: this.pathname
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });
      return findRequest.execute()
        .then(response => response.data)
        .then((entities) => {
          const syncEntity = entities.length === 1
            ? entities[0]
            : { collection: this.collection, state: {}, entityId: id };

          // Update the state
          syncEntity.state = syncEntity.state || {};
          syncEntity.state.operation = operation;

          // Send a request to save the sync entity
          const request = new CacheRequest({
            method: RequestMethod.PUT,
            url: url.format({
              protocol: this.client.apiProtocol,
              host: this.client.apiHost,
              pathname: this.pathname
            }),
            properties: options.properties,
            body: syncEntity,
            timeout: options.timeout
          });
          return request.execute();
        });
    })).then(() => {
      if (singular === true) {
        return entities[0];
      }

      return entities;
    });
  }

  pull(query, options = {}) {
    // Check that the query is valid
    if (query && !(query instanceof Query)) {
      return Promise.reject(new SyncError('Invalid query. It must be an instance of the Query class.'));
    }

    return this.count(query)
      .then((count) => {
        // Attempt to push any pending sync data before fetching from the network.
        if (count > 0) {
          return this.push(query)
            .then(() => this.count(query));
        }

        return count;
      })
      .then((count) => {
        // Throw an error if there are still items that need to be synced
        if (count > 0) {
          throw new SyncError('Unable to pull data from the network.'
            + ` There are ${count} entities that need`
            + ' to be synced before data is loaded from the network.');
        }


        const config = {
          method: RequestMethod.GET,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: this.backendPathname
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: this.client
        };
        let request = new KinveyRequest(config);

        // Should we use delta fetch?
        if (options.useDeltaFetch === true) {
          request = new DeltaFetchRequest(config);
        }

        // Execute the request
        return request.execute();
      })
      .then(response => response.data);
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
  push(query, options = {}) {
    const batchSize = 100;
    let i = 0;

    // Don't push data to the backend if we are in the middle
    // of already pushing data
    if (pushInProgress.get(this.collection) === true) {
      return Promise.reject(new SyncError('Data is already being pushed to the backend.'
        + ' Please wait for it to complete before pushing new data to the backend.'));
    }

    // Set pushInProgress to true
    pushInProgress.set(this.collection, true);

    return this.find(query)
      .then((syncEntities) => {
        if (syncEntities.length > 0) {
          // Sync the entities in batches to prevent exhausting
          // available network connections
          const batchSync = (syncResults) => {
            const promise = new Promise((resolve) => {
              const batch = syncEntities.slice(i, i + batchSize);
              i += batchSize;

              // Get the results of syncing all of the entities
              return Promise.all(map(batch, (syncEntity) => {
                const { entityId, state = {} } = syncEntity;
                const operation = state.operation || state.method;

                if (operation === SyncOperation.Delete) {
                  // Remove the entity from the network.
                  const request = new KinveyRequest({
                    method: RequestMethod.DELETE,
                    authType: AuthType.Default,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `${this.backendPathname}/${entityId}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout,
                    client: this.client
                  });
                  return request.execute()
                    .then(() => {
                      // Remove the sync entity from the cache
                      const request = new CacheRequest({
                        method: RequestMethod.DELETE,
                        url: url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: `${this.pathname}/${syncEntity._id}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout
                      });
                      return request.execute();
                    })
                    .then(() => {
                      // Return the result
                      const result = { _id: entityId, operation: operation };
                      return result;
                    })
                    .catch((error) => {
                      // Return the result of the sync operation.
                      const result = {
                        _id: entityId,
                        operation: operation,
                        error: error
                      };
                      return result;
                    });
                } else if (operation === SyncOperation.Create || operation === SyncOperation.Update) {
                  let local = false;

                  // Get the entity from cache
                  const request = new CacheRequest({
                    method: RequestMethod.GET,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `${this.backendPathname}/${entityId}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  return request.execute()
                    .then(response => response.data)
                    .then((entity) => {
                      // Save the entity to the backend.
                      const request = new KinveyRequest({
                        method: RequestMethod.PUT,
                        authType: AuthType.Default,
                        url: url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: `${this.backendPathname}/${entityId}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        body: entity,
                        client: this.client
                      });

                      // Send a POST request, and update the url.
                      if (operation === SyncOperation.Create) {
                        // If the entity was created locally then delete the autogenerated _id
                        if (isDefined(entity._kmd) && entity._kmd.local === true) {
                          local = true;
                          delete entity._id;
                        }

                        request.method = RequestMethod.POST;
                        request.url = url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: this.backendPathname
                        });
                      }

                      return request.execute()
                        .then(response => response.data)
                        .then((entity) => {
                          // Remove the sync entity
                          const request = new CacheRequest({
                            method: RequestMethod.DELETE,
                            url: url.format({
                              protocol: this.client.apiProtocol,
                              host: this.client.apiHost,
                              pathname: `${this.pathname}/${syncEntity._id}`
                            }),
                            properties: options.properties,
                            timeout: options.timeout
                          });
                          return request.execute()
                            .then(() => {
                              // Save the result of the network request locally.
                              const request = new CacheRequest({
                                method: RequestMethod.PUT,
                                url: url.format({
                                  protocol: this.client.apiProtocol,
                                  host: this.client.apiHost,
                                  pathname: `${this.backendPathname}/${entity._id}`
                                }),
                                properties: options.properties,
                                timeout: options.timeout,
                                body: entity
                              });
                              return request.execute()
                                .then(response => response.data);
                            })
                            .then((entity) => {
                              // Remove the original entity if it was created locally
                              if (local) {
                                const request = new CacheRequest({
                                  method: RequestMethod.DELETE,
                                  url: url.format({
                                    protocol: this.client.apiProtocol,
                                    host: this.client.apiHost,
                                    pathname: `${this.backendPathname}/${entityId}`
                                  }),
                                  properties: options.properties,
                                  timeout: options.timeout
                                });

                                return request.execute()
                                  .then(() => entity);
                              }

                              return entity;
                            })
                            .then((entity) => {
                              // Return the result of the sync operation.
                              const result = {
                                _id: entityId,
                                operation: operation,
                                entity: entity
                              };
                              return result;
                            });
                        })
                        .catch((error) => {
                          // Set then id back on the entity
                          entity._id = entityId;

                          // Return the result of the sync operation.
                          const result = {
                            _id: entityId,
                            operation: operation,
                            entity: entity,
                            error: error
                          };
                          return result;
                        });
                    })
                    .catch((error) => {
                      const result = {
                        _id: entityId,
                        operation: operation,
                        entity: undefined,
                        error: error
                      };
                      return result;
                    });
                }

                return {
                  _id: entityId,
                  operation: operation,
                  entity: undefined,
                  error: new SyncError('Unable to sync the entity since the operation was not recognized.', syncEntity)
                };
              })).then((results) => {
                // Concat the results
                syncResults = syncResults.concat(results);

                // Sync the remaining entities
                if (i < syncEntities.length) {
                  return resolve(batchSync(syncResults));
                }

                // Resolve with the sync results
                return resolve(syncResults);
              });
            });
            return promise;
          };

          // Return the result
          return batchSync([]);
        }

        // Return an empty array
        return [];
      })
      .then((result) => {
        // Set pushInProgress to false
        pushInProgress.set(this.collection, false);
        return result;
      })
      .catch((error) => {
        // Set pushInProgress to false
        pushInProgress.set(this.collection, false);
        throw error;
      });
  }

  /**
   * Clear the sync table. A query can be provided to
   * only clear a subset of the sync table.
   *
   * @param   {Query}         [query]                     Query
   * @param   {Object}        [options={}]                Options
   * @param   {Number}        [options.timeout]           Timeout for the request.
   * @return  {Promise}                                   Promise
   */
  clear(query, options = {}) {
    return this.find(query, options)
      .then((entities) => {
        return Promise.all(map(entities, (entity) => {
          const request = new CacheRequest({
            method: RequestMethod.DELETE,
            url: url.format({
              protocol: this.client.apiProtocol,
              host: this.client.apiHost,
              pathname: `${this.pathname}/${entity._id}`
            }),
            properties: options.properties,
            timeout: options.timeout
          });
          return request.execute()
            .then(response => response.data);
        }));
      });
  }
}
