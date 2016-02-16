import CacheStore from './cacheStore';
import LocalRequest from '../requests/localRequest';
import Aggregation from '../aggregation';
import { HttpMethod } from '../enums';
import { KinveyError } from '../errors';
import Query from '../query';
import Auth from '../auth';
import assign from 'lodash/assign';
import log from '../log';

export default class SyncStore extends CacheStore {

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
        return response.data;
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
        return response.data;
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
        return response.data;
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
        return response.data;
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
        return this._updateSync(response.data, options).then(() => {
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
        return this._updateSync(response.data, options).then(() => {
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
}
