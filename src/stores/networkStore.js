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
const clientSymbol = Symbol();

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

  get client() {
    return this[clientSymbol];
  }

  set client(client) {
    this[clientSymbol] = client;
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}                Pathname
   */
  get pathname() {
    let pathname = `/${appdataNamespace}`;

    if (this.client) {
      pathname = `${pathname}/${this.client.appKey}`;
    }

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
  async find(query, options = {}) {
    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);
    options.flags = qs.parse(options.flags);

    if (query && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');
    }

    const request = new NetworkRequest({
      method: HttpMethod.GET,
      authType: AuthType.Default,
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
    return request.execute().then(response => response.data);
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
  async group(aggregation, options = {}) {
    options = assign({
      properties: null,
      timeout: undefined,
      useDeltaFetch: true,
      handler() {}
    }, options);

    if (!(aggregation instanceof Aggregation)) {
      throw new KinveyError('Invalid aggregation. It must be an instance of the Kinvey.Aggregation class.');
    }

    const request = new NetworkRequest({
      method: HttpMethod.GET,
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/_group`
      }),
      properties: options.properties,
      data: aggregation.toJSON(),
      timeout: options.timeout,
      client: this.client
    });

    return request.execute().then(response => response.data);
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
  async count(query, options = {}) {
    options = assign({
      properties: null,
      timeout: undefined,
      useDeltaFetch: true,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');
    }

    const request = new NetworkRequest({
      method: HttpMethod.GET,
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/_count`
      }),
      properties: options.properties,
      query: query,
      timeout: options.timeout,
      client: this.client
    });
    return request.execute().then(response => response.data);
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
  async findById(id, options = {}) {
    if (!id) {
      Log.warn('No id was provided to retrieve an entity.', id);
      return null;
    }

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
        pathname: `${this.pathname}/${id}`,
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    return request.execute().then(response => response.data);
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
  async save(entity, options = {}) {
    if (!entity) {
      Log.warn('No entity was provided to be saved.', entity);
      return null;
    }

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
        pathname: this.pathname
      }),
      properties: options.properties,
      data: entity,
      timeout: options.timeout,
      client: this.client
    });

    const id = entity[idAttribute];
    if (id) {
      request.method = HttpMethod.PUT;
      request.url = url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/${id}`
      });
    }

    return request.execute().then(response => response.data);
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
    options = assign({
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');
    }

    const request = new NetworkRequest({
      method: HttpMethod.DELETE,
      authType: AuthType.Default,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname,
      }),
      properties: options.properties,
      query: query,
      timeout: options.timeout
    });
    return request.execute().then(response => response.data);
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
      return null;
    }

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
        pathname: `${this.pathname}/${id}`,
      }),
      properties: options.properties,
      timeout: options.timeout
    });
    return request.execute().then(response => response.data);
  }
}
