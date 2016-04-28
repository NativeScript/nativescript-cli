import Promise from 'babybird';
import { CacheStore } from './cachestore';
import { LocalRequest } from '../requests/local';
import { Aggregation } from '../aggregation';
import { HttpMethod } from '../enums';
import { KinveyError } from '../errors';
import { Query } from '../query';
import { Log } from '../log';
import { Metadata } from '../metadata';
import url from 'url';
import xorWith from 'lodash/xorWith';
import filter from 'lodash/filter';
import keyBy from 'lodash/keyBy';
import map from 'lodash/map';
import isArray from 'lodash/isArray';
import parallel from 'async/parallel';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

export class SyncStore extends CacheStore {
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

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

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

    const promise = request.execute().then(response => response.data);

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

    if (!(aggregation instanceof Aggregation)) {
      return Promise.reject(new KinveyError('Invalid aggregation. ' +
        'It must be an instance of the Kinvey.Aggregation class.'));
    }

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

    const promise = request.execute().then(response => response.data);

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

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

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

    const promise = request.execute().then(response => response.data);

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

    const promise = request.execute().then(response => response.data);

    promise.then(response => {
      Log.info(`Retrieved the entity in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      Log.error(`Failed to retrieve the entity in the ${this.name} collection with id = ${id}.`, err);
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
  async save(entities, options = {}) {
    let singular = false;

    if (!entities) {
      Log.warn('No entity was provided to be saved.', entities);
      return Promise.resolve(null);
    }

    const request = new LocalRequest({
      method: HttpMethod.POST,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this._pathname
      }),
      properties: options.properties,
      body: entities,
      timeout: options.timeout
    });

    if (entities[idAttribute]) {
      request.method = HttpMethod.PUT;
      request.url = url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this._pathname}/${entities[idAttribute]}`
      });
    }

    entities = await request.execute().then(response => response.data);

    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    await Promise.all(map(entities, entity => this.sync.save(this.name, entity, options)));
    return singular ? entities[0] : entities;
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
  async remove(query, options = {}) {
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

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

    const entities = await request.execute().then(response => response.data);
    const localEntities = filter(entities, entity => {
      const metadata = new Metadata(entity);
      return metadata.isLocal();
    });
    const syncEntities = xorWith(entities, localEntities,
      (entity, localEntity) => entity[idAttribute] === localEntity[idAttribute]);

    return new Promise((reject, resolve) => {
      parallel([
        async callback => {
          const query = new Query();
          query.contains('entityId', Object.keys(keyBy(localEntities, idAttribute)));
          await this.sync.clear(query, options);
          callback();
        },
        async callback => {
          await this.sync.remove(this.name, syncEntities, options);
          callback();
        }
      ], error => {
        if (error) {
          return reject(error);
        }

        return resolve(entities);
      });
    });
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
  async removeById(id, options = {}) {
    if (!id) {
      Log.warn('No id was provided to be removed.', id);
      return Promise.resolve(null);
    }

    const request = new LocalRequest({
      method: HttpMethod.DELETE,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this._pathname}/${id}`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });

    const entity = await request.execute().then(response => response.data);
    const metadata = new Metadata(entity);

    if (metadata.isLocal()) {
      const query = new Query();
      query.equalTo('entityId', entity[idAttribute]);
      await this.sync.clear(this.name, query, options);
    } else {
      await this.sync.remove(this.name, entity, options);
    }

    return entity;
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
   */
  pull(query, options = {}) {
    const promise = this.syncCount(null, options).then(count => {
      if (count > 0) {
        throw new KinveyError('Unable to pull data. You must push the pending sync items first.',
          'Call store.push() to push the pending sync items before you pull new data.');
      }

      return super.find(query, options);
    }).then(result => result.networkPromise);
    return promise;
  }
}
