import Promise from 'babybird';
import { Aggregation } from '../aggregation';
import { AuthType, HttpMethod } from '../enums';
import { KinveyError } from '../errors';
import { Client } from '../client';
import { NetworkRequest } from '../requests/network';
import { Query } from '../query';
import { Log } from '../log';
import qs from 'qs';
import url from 'url';
import assign from 'lodash/assign';
import isString from 'lodash/isString';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The NetworkStore class is used to find, save, update, remove, count and group enitities
 * in a collection on the network.
 */
export class NetworkStore {
  /**
   * Creates a new instance of the NetworkStore class.
   *
   * @param   {string}  name   Name of the collection
   *
   * @throws  {KinveyError}   If the name provided is not a string.
   */
  constructor(name) {
    if (name && !isString(name)) {
      throw new KinveyError('Name must be a string.');
    }

    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @private
     * @type {Client}
     */
    this.client = Client.sharedInstance();
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}                Pathname
   */
  get _pathname() {
    let pathname = `/${appdataNamespace}/${this.client.appKey}`;

    if (this.name) {
      pathname = `${pathname}/${this.name}`;
    }

    return pathname;
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
   * @return  {Promise}                                                         Promise
   */
  find(query, options = {}) {
    Log.debug(`Retrieving the entities in the ${this.name} collection.`, query);

    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);
    options.flags = qs.parse(options.flags);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const request = new NetworkRequest({
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

    const promise = request.execute().then(response => response.data);

    promise.then(response => {
      Log.info(`Retrieved the entities in the ${this.name} collection.`, response);
    }).catch(error => {
      Log.error(`Failed to retrieve the entities in the ${this.name} collection.`, error);
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
   * @return  {Promise}                                                         Promise
   */
  group(aggregation, options = {}) {
    Log.debug(`Grouping the entities in the ${this.name} collection.`, aggregation, options);

    options = assign({
      properties: null,
      timeout: undefined,
      useDeltaFetch: true,
      handler() {}
    }, options);

    if (!(aggregation instanceof Aggregation)) {
      return Promise.reject(new KinveyError('Invalid aggregation. ' +
        'It must be an instance of the Kinvey.Aggregation class.'));
    }

    const request = new NetworkRequest({
      method: HttpMethod.GET,
      authType: AuthType.Default,
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
   * @return  {Promise}                                                         Promise
   */
  count(query, options = {}) {
    Log.debug(`Counting the number of entities in the ${this.name} collection.`, query);

    options = assign({
      properties: null,
      timeout: undefined,
      useDeltaFetch: true,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const request = new NetworkRequest({
      method: HttpMethod.GET,
      authType: AuthType.Default,
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
   * @return  {Promise}                                                         Promise
   */
  findById(id, options = {}) {
    if (!id) {
      Log.warn('No id was provided to retrieve an entity.', id);
      return Promise.resolve(null);
    }

    Log.debug(`Retrieving the entity in the ${this.name} collection with id = ${id}.`);

    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.GET,
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this._pathname}/${id}`,
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
   * @param   {Object|Array}          doc                                       Document or entities to save.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  save(entity, options = {}) {
    if (!entity) {
      Log.warn('No entity was provided to be saved.', entity);
      return Promise.resolve(null);
    }

    Log.debug(`Saving the entity(s) to the ${this.name} collection.`, entity);

    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      authType: AuthType.Default,
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

    const promise = request.execute().then(response => response.data);

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

    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const request = new NetworkRequest({
      method: HttpMethod.DELETE,
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this._pathname,
      }),
      properties: options.properties,
      query: query,
      timeout: options.timeout
    });

    const promise = request.execute().then(response => response.data);

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

    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.DELETE,
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this._pathname}/${id}`,
      }),
      properties: options.properties,
      timeout: options.timeout
    });

    const promise = request.execute().then(response => response.data);

    promise.then(response => {
      Log.info(`Removed the entity in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      Log.error(`Failed to remove the entity in the ${this.name} collection with id = ${id}.`, err);
    });

    return promise;
  }
}
