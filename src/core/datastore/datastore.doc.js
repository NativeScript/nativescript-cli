/* eslint-disable */

/**
 * The DataStore class is used to find, create, update, remove, count and group entities in a collection.
 */
export class DataStore {
  /**
  * Returns an instance of th DataStore class based on the type provided.
  *
  * @param  {string}           [collection]                  Name of the collection.
  * @param  {DataStoreType}    [type=DataStoreType.Cache]    Type of store to return.
  * @return {DataStore}                                      DataStore instance.
  */
  static collection(collection, type = DataStoreType.Cache, options) {}

  /**
   * Clear the cache. This will delete all data in the cache.
   *
   * @return {Promise<Object>} The result of clearing the cache.
   */
  static clearCache() {}

  /**
   * Find all entities in the collection. A query can be optionally provided to return
   * a subset of all entities in a collection or omitted to return all entities in
   * a collection. The number of entities returned adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                             Query used to filter entities.
   * @param   {Object}                [options]                           Options
   * @param   {Boolean}               [options.useDeltaSet]               Turn on or off the use of delta set.
   * @return  {Observable}                                                Observable.
   */
  find(query, options = {}) { }

  /**
   * Find a single entity in the collection by id.
   *
   * @param   {string}                id                               Entity by id to find.
   * @param   {Object}                [options]                        Options
   * @param   {Boolean}               [options.useDeltaSet]            Turn on or off the use of delta set.
   * @return  {Observable}                                             Observable.
   */
  findById(id, options = {}) { }

  /**
   * Group entities.
   *
   * @param   {Aggregation}           aggregationQuery                    Aggregation used to group entities.
   * @return  {Observable}                                                Observable.
   */
  group(aggregationQuery, options = {}) { }

  /**
   * Count all entities in the collection. A query can be optionally provided to return
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
  count(query, options = {}) { }

  /**
   * Create a single entity on the collection.
   *
   * @param   {Object}                entity                            Entity that you want to create on the collection.
   * @return  {Promise}                                                 Created entity.
   *
   * @throws {KinveyError} Unable to create an array of entities.
   */
  create(entity, options = {}) { }

  /**
   * Update a single entity on the data store.
   *
   * @param   {Object}                entity                            Entity that you want to update on the collection.
   * @return  {Promise}                                                 Updated entity.
   *
   * @throws {KinveyError} Unable to update an array of entities.
   * @throws {KinveyError} The entity provided does not contain an _id. An _id is required to update the entity.
   */
  update(entity, options = {}) { }

  /**
   * Save a single entity on the data store.
   *
   * @param   {Object}                entity                            Entity that you want to save on the collection.
   * @return  {Promise}                                                 Promise.
   */
  save(entity, options) { }

  /**
   * Remove all entities in the data store. A query can be optionally provided to remove
   * a subset of all entities in a collection or omitted to remove all entities in
   * a collection. The number of entities removed adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                           Query used to filter entities.
   * @return  {Promise}                                                 Number of entities removed.
   */
  remove(query, options = {}) { }

  /**
   * Remove a single entity in the data store by id.
   *
   * @param   {string}                id                               Entity by id to remove.
   * @return  {Promise}                                                Number of entities removed.
   */
  removeById(id, options = {}) { }

  /**
   * Remove all entities in the collection that are stored in the local cache.
   *
   * @param   {Query}                 [query]                           Query used to filter entities.
   * @return  {Promise}                                                 Number of entities removed.
   */
  clear(query, options = {}) {}

  /**
   * Count the number of entities waiting to be pushed to the backend.
   *
   * @param   {Query}                 [query]                                   Query to count a subset of entities.
   * @return  {Promise}                                                         Pending sync entities
   */
  pendingSyncCount(query) {}

  /**
   * Retrieve the entities waiting to be pushed to the backend.
   *
   * @param   {Query}                 [query]                                   Query to count a subset of entities.
   * @return  {Promise}                                                         Pending sync entities
   */
  pendingSyncEntities(query) {}

  /**
   * Push pending sync items to the backend.
   *
   * @param   {Query}                 [query]                                   Query to push a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Push result
   */
  push(query, options) {}

  /**
   * Pull entities from the backend and save them to the local cache
   *
   * IMPORTANT: This method is not intended to be used to make concurrent requests.
   * If you wish to pull multiple pages, please use the autoPagination option
   *
   * @param   {Query}                 [query]                                   Query to pull a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise<number>}                                                 Number of entities pulled
   */
  pull(query, options = {}) {}

  /**
   * Sync items with the backend. This will push pending sync items first and then
   * pull items from the backend and save them to the local cache.
   *
   * @param   {Query}                 [query]                                   Query used to pull a subset of entities.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise<{push: [], pull: number}>}                               Sync result
   */
  sync(query, options) {}

  /**
   * Clear pending sync items from the sync queue.
   *
   * @param {Query} query Query used to clear a subset of pending sync items
   * @return {Promise}
   */
  clearSync(query) {
    return this.syncManager.clearSync(this.collection, query);
  }
}
