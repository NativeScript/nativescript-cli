import NetworkStore from './networkStore';
import LocalRequest from '../requests/localRequest';
import NetworkRequest from '../requests/networkRequest';
import DeltaFetchRequest from '../requests/deltaFetchRequest';
import Response from '../requests/response';
import { HttpMethod, StatusCode, ReadPolicy } from '../enums';
import { KinveyError, NotFoundError } from '../errors';
import Query from '../query';
import Aggregation from '../aggregation';
import Auth from '../auth';
import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import clone from 'lodash/clone';
import map from 'lodash/map';
import log from '../log';
import differenceBy from 'lodash/differenceBy';
import isArray from 'lodash/isArray';
import keyBy from 'lodash/keyBy';
import { nested } from '../utils/object';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';
const localAttribute = process.env.KINVEY_LOCAL_ATTRIBUTE || '_kmd.local';

/**
 * The CacheStore class is used to find, save, update, remove, count and group enitities
 * in a collection on the network using a cache on the device.
 */
export default class CacheStore extends NetworkStore {
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
  }

  /**
   * The sync pathname for the store.
   *
   * @param   {Client}   [client]     Client
   * @return  {string}                Sync pathname
   */
  get _syncPathname() {
    if (!this.name) {
      throw new Error('Unable to get a sync pathname for a collection with no name.');
    }

    return `/${appdataNamespace}/${this.client.appKey}/${syncCollectionName}/${this.name}`;
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
    log.debug(`Retrieving the entities in the ${this.name} collection.`, query);

    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      useDeltaFetch: true,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: this.client.getUrl(this._pathname),
        properties: options.properties,
        auth: Auth.default,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        const result = {
          cache: response.data
        };

        result.network = this.syncCount().then(count => {
          if (count > 0) {
            throw new KinveyError('Please sync before you load data from the network.');
          }

          if (options.useDeltaFetch) {
            const request = new DeltaFetchRequest({
              method: HttpMethod.GET,
              url: this.client.getUrl(this._pathname),
              properties: options.properties,
              auth: Auth.default,
              query: query,
              timeout: options.timeout
            });
            return request.execute().then(response => {
              if (response.isSuccess()) {
                return response.data;
              }

              throw response.error;
            });
          }

          return super.find(query, options);
        }).then(data => {
          const removedEntityIds = Object.keys(keyBy(differenceBy(result.cache, data, entity => {
            return entity[idAttribute];
          }), idAttribute));
          const removeQuery = new Query();
          removeQuery.contains(idAttribute, removedEntityIds);

          const removeRequest = new LocalRequest({
            method: HttpMethod.DELETE,
            url: this.client.getUrl(this._pathname),
            properties: options.properties,
            auth: Auth.default,
            query: removeQuery,
            timeout: options.timeout
          });
          return removeRequest.execute().then(response => {
            if (response.isSuccess()) {
              return this._updateCache(data);
            }

            throw response.error;
          });
        });

        return result;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Retrieved the entities in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to retrieve the entities in the ${this.name} collection.`, err);
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
    log.debug(`Grouping the entities in the ${this.name} collection.`, aggregation, options);

    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    if (!(aggregation instanceof Aggregation)) {
      return Promise.reject(new KinveyError('Invalid aggregation. ' +
        'It must be an instance of the Kinvey.Aggregation class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: this.client.getUrl(`${this._pathname}/_group`),
        properties: options.properties,
        auth: Auth.default,
        data: aggregation.toJSON(),
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        const result = {
          cache: response.data
        };

        result.network = this.syncCount().then(count => {
          if (count > 0) {
            throw new KinveyError('You must push the pending sync items first before you load data from the network.',
              'Call store.push() to push the pending sync items.');
          }

          return super.group(aggregation, options);
        });

        return result;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Grouped the entities in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to group the entities in the ${this.name} collection.`, err);
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
    log.debug(`Counting the number of entities in the ${this.name} collection.`, query);

    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: this.client.getUrl(`${this._pathname}/_count`),
        properties: options.properties,
        auth: Auth.default,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        const result = {
          cache: response.data
        };

        result.network = this.syncCount().then(count => {
          if (count > 0) {
            throw new KinveyError('You must push the pending sync items first before you load data from the network.',
              'Call store.push() to push the pending sync items.');
          }

          return super.count(query, options);
        });

        return result;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Counted the number of entities in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to count the number of entities in the ${this.name} collection.`, err);
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
      log.warn('No id was provided to retrieve an entity.', id);
      return Promise.resolve(null);
    }

    log.debug(`Retrieving the entity in the ${this.name} collection with id = ${id}.`);

    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      useDeltaFetch: true,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: this.client.getUrl(`${this._pathname}/${id}`),
        properties: options.properties,
        auth: Auth.default,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        const result = {
          cache: response.data
        };

        result.network = this.syncCount().then(count => {
          if (count > 0) {
            throw new KinveyError('You must push the pending sync items first before you load data from the network.',
              'Call store.push() to push the pending sync items.');
          }

          if (options.useDeltaFetch) {
            const request = new DeltaFetchRequest({
              method: HttpMethod.GET,
              url: this.client.getUrl(`${this._pathname}/${id}`),
              properties: options.properties,
              auth: Auth.default,
              timeout: options.timeout
            });
            return request.execute().then(response => {
              if (response.isSuccess()) {
                return response.data;
              }

              throw response.error;
            });
          }

          return super.findById(id, options);
        }).then(data => {
          return this._updateCache(data);
        }).catch(err => {
          if (err instanceof NotFoundError) {
            const removeRequest = new LocalRequest({
              method: HttpMethod.DELETE,
              url: this.client.getUrl(`${this._pathname}/${id}`),
              properties: options.properties,
              auth: Auth.default,
              timeout: options.timeout
            });
            return removeRequest.execute().then(response => {
              if (response.isSuccess()) {
                throw err;
              }

              throw response.error;
            });
          }

          throw err;
        });

        return result;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Retrieved the entity in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      log.error(`Failed to retrieve the entity in the ${this.name} collection with id = ${id}.`, err);
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
      log.warn('No entity was provided to be saved.', entity);
      return Promise.resolve(null);
    }

    if (entity._id) {
      log.warn('Entity argument contains an _id. Calling update instead.', entity);
      return this.update(entity, options);
    }

    log.debug(`Saving the entity(s) to the ${this.name} collection.`, entity);

    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.POST,
        url: this.client.getUrl(this._pathname),
        properties: options.properties,
        auth: Auth.default,
        data: entity,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return this._updateSync(response.data, options).then(() => {
          const data = isArray(response.data) ? response.data : [response.data];
          const ids = Object.keys(keyBy(data, idAttribute));
          const query = new Query().contains(idAttribute, ids);
          return this.push(query, options);
        }).then(() => {
          return response.data;
        });
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Saved the entity(s) to the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to save the entity(s) to the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Updates a entity or an array of entities in a collection. A promise will be returned that
   * will be resolved with the updated entity/entities or rejected with an error.
   *
   * @param   {Object|Array}          entities                                  Entity or entities to update.
   * @param   {Object}                [options]                                 Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data updated
   *                                                                            in the cache.
   * @return  {Promise}                                                         Promise
   */
  update(entity, options = {}) {
    if (!entity) {
      log.warn('No entity was provided to be updated.', entity);
      return Promise.resolve(null);
    }

    if (!entity._id) {
      log.warn('Entity argument does not contain an _id. Calling save instead.', entity);
      return this.save(entity, options);
    }

    log.debug(`Updating the entity(s) in the ${this.name} collection.`, entity);

    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.PUT,
        url: this.client.getUrl(`${this._pathname}/${entity._id}`),
        properties: options.properties,
        auth: Auth.default,
        data: entity,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return this._updateSync(response.data, options).then(() => {
          const data = isArray(response.data) ? response.data : [response.data];
          const ids = Object.keys(keyBy(data, idAttribute));
          const query = new Query().contains(idAttribute, ids);
          return this.push(query, options);
        }).then(() => {
          return response.data;
        });
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Updated the entity(s) in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to update the entity(s) in the ${this.name} collection.`, err);
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
    log.debug(`Removing the entities in the ${this.name} collection.`, query);

    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.DELETE,
        url: this.client.getUrl(this._pathname),
        properties: options.properties,
        auth: Auth.default,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return this.push(query, options).then(() => {
          return response.data;
        });
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Removed the entities in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to remove the entities in the ${this.name} collection.`, err);
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
      log.warn('No id was provided to be removed.', id);
      return Promise.resolve(null);
    }

    log.debug(`Removing an entity in the ${this.name} collection with id = ${id}.`);

    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.DELETE,
        url: this.client.getUrl(`${this._pathname}/${id}`),
        properties: options.properties,
        auth: Auth.default,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        const query = new Query().contains(idAttribute, [id]);
        return this.push(query, options).then(() => {
          return response.data;
        });
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Removed the entity in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      log.error(`Failed to remove the entity in the ${this.name} collection with id = ${id}.`, err);
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
    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: this.client.getUrl(this._syncPathname),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        const save = [];
        const remove = [];
        const entities = response.data.entities;
        const ids = Object.keys(entities);
        let size = response.data.size;

        const promises = map(ids, id => {
          const metadata = clone(entities[id], true);
          const request = new LocalRequest({
            method: HttpMethod.GET,
            url: this.client.getUrl(`${this._pathname}/${id}`),
            properties: metadata.properties,
            auth: Auth.default,
            timeout: options.timeout
          });
          return request.execute().then(response => {
            if (response.isSuccess()) {
              save.push(response.data);
              return response.data;
            }

            throw response.error;
          }).catch(err => {
            if (err instanceof NotFoundError) {
              remove.push(id);
              return null;
            }

            throw err;
          });
        });

        return Promise.all(promises).then(() => {
          const saved = map(save, entity => {
            const metadata = clone(entities[entity[idAttribute]], true);
            const isLocalEntity = nested(entity, localAttribute);

            if (isLocalEntity) {
              const originalId = entity._id;
              delete entity._id;
              const request = new NetworkRequest({
                method: HttpMethod.POST,
                url: this.client.getUrl(this._pathname),
                properties: metadata.properties,
                auth: Auth.default,
                data: entity,
                timeout: options.timeout
              });

              return request.execute().then(response => {
                if (response.isSuccess()) {
                  const request = new LocalRequest({
                    method: HttpMethod.PUT,
                    url: this.client.getUrl(this._pathname),
                    properties: metadata.properties,
                    auth: Auth.default,
                    data: response.data,
                    timeout: options.timeout
                  });
                  return request.execute();
                }

                throw response.error;
              }).then(response => {
                if (response.isSuccess()) {
                  const request = new LocalRequest({
                    method: HttpMethod.DELETE,
                    url: this.client.getUrl(`${this._pathname}/${originalId}`),
                    properties: metadata.properties,
                    auth: Auth.default,
                    timeout: options.timeout
                  });
                  return request.execute().then(response => {
                    if (response.isSuccess()) {
                      const result = response.data;
                      if (result.count === 1) {
                        size = size - 1;
                        delete entities[originalId];
                        return {
                          _id: originalId,
                          entity: entity
                        };
                      }

                      return result;
                    }

                    throw response.error;
                  });
                }

                throw response.error;
              }).catch(err => {
                return {
                  _id: originalId,
                  error: err
                };
              });
            }

            const request = new NetworkRequest({
              method: HttpMethod.PUT,
              url: this.client.getUrl(`${this._pathname}/${entity._id}`),
              properties: metadata.properties,
              auth: Auth.default,
              data: entity,
              timeout: options.timeout
            });
            return request.execute().then(response => {
              if (response.isSuccess()) {
                size = size - 1;
                delete entities[response.data._id];
                return {
                  _id: response.data._id,
                  entity: response.data
                };
              }

              throw response.error;
            }).catch(err => {
              return {
                _id: entity._id,
                error: err
              };
            });
          });

          const removed = map(remove, id => {
            const metadata = clone(entities[id], true);
            const request = new NetworkRequest({
              method: HttpMethod.DELETE,
              url: this.client.getUrl(`${this._pathname}/${id}`),
              properties: metadata.properties,
              auth: Auth.default,
              timeout: options.timeout
            });

            return request.execute().then(response => {
              if (response.isSuccess()) {
                const result = response.data;

                if (result.count === 1) {
                  size = size - 1;
                  delete entities[id];
                  return {
                    _id: id
                  };
                }

                return result;
              }

              throw response.error;
            }).catch(err => {
              return {
                _id: id,
                error: err
              };
            });
          });

          return Promise.all([Promise.all(saved), Promise.all(removed)]);
        }).then(results => {
          const savedResults = results[0];
          const removedResults = results[1];
          const result = {
            collection: this.name,
            success: [],
            error: []
          };

          forEach(savedResults, savedResult => {
            if (savedResult.error) {
              result.error.push(savedResult);
            } else {
              result.success.push(savedResult);
            }
          });

          forEach(removedResults, removedResult => {
            if (removedResult.error) {
              result.error.push(removedResult);
            } else {
              result.success.push(removedResult);
            }
          });

          return result;
        }).then(result => {
          response.data.size = size;
          response.data.entities = entities;
          const request = new LocalRequest({
            method: HttpMethod.PUT,
            url: this.client.getUrl(this._syncPathname),
            properties: options.properties,
            data: response.data,
            timeout: options.timeout
          });
          return request.execute().then(response => {
            if (response.isSuccess()) {
              return result;
            }

            throw response.error;
          });
        });
      }

      throw response.error;
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return {
          collection: this.name,
          success: [],
          error: []
        };
      }

      throw err;
    });

    return promise;
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

      options.readPolicy = ReadPolicy.NetworkOnly;
      return this.find(query, options);
    });

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
      return this.pull(query, options).then(pullResponse => {
        return {
          push: pushResponse,
          pull: pullResponse
        };
      });
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
   * store.pushCount().then(function(count) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  pushCount(query, options = {}) {
    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        client: this.client,
        properties: options.properties,
        auth: Auth.default,
        pathname: this._getSyncPathname(this.client),
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return response.data.size || 0;
      }

      throw response.error;
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return 0;
      }

      throw err;
    });

    return promise;
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
  _updateCache(entities, options = {}) {
    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.PUT,
        url: this.client.getUrl(this._pathname),
        properties: options.properties,
        auth: Auth.default,
        data: entities,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

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
  _updateSync(entities, options = {}) {
    if (!this.name) {
      return Promise.reject(new KinveyError('Unable to add entities to the sync table for a store with no name.'));
    }

    if (!entities) {
      return Promise.resolve(null);
    }

    options = assign({
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        url: this.client.getUrl(this._getSyncPathname),
        properties: options.properties,
        auth: Auth.default,
        timeout: options.timeout
      });
      return request.execute();
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return new Response({
          statusCode: StatusCode.Ok,
          data: {
            _id: this.name,
            entities: {},
            size: 0
          }
        });
      }

      throw err;
    }).then(response => {
      if (response.isSuccess()) {
        const syncData = response.data || {
          _id: this.name,
          entities: {},
          size: 0
        };

        if (!isArray(entities)) {
          entities = [entities];
        }

        forEach(entities, entity => {
          if (entity._id) {
            if (!syncData.docs.hasOwnProperty(entity._id)) {
              syncData.size = syncData.size + 1;
            }

            syncData.entities[entity._id] = {
              lmt: entity._kmd ? entity._kmd.lmt : null
            };
          }
        });

        const request = new LocalRequest({
          method: HttpMethod.PUT,
          url: this.client.getUrl(this._syncPathname),
          properties: options.properties,
          auth: options.auth,
          data: syncData,
          timeout: options.timeout
        });
        return request.execute();
      }

      throw response.error;
    }).then(response => {
      if (response.isSuccess()) {
        return null;
      }

      throw response.error;
    });

    return promise;
  }
}
