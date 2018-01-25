import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import url from 'url';
import { DeltaFetchRequest, KinveyRequest, AuthType, RequestMethod } from '../request';
import { KinveyError } from '../errors';
import { Query } from '../query';
import { Client } from '../client';
import { isDefined } from '../utils';
import { KinveyObservable } from '../observable';
import { Aggregation } from '../aggregation';
import { getLiveCollectionManager } from '../live';

/**
 * The NetworkStore class is used to find, create, update, remove, count and group entities over the network.
 */
export class NetworkStore {
  constructor(collection, options = {}) {
    if (collection && !isString(collection)) {
      throw new KinveyError('Collection must be a string.');
    }

    /**
     * @type {string}
     */
    this.collection = collection;

    if (options.tag) {
      let tag = options.tag;

      if (!isString(tag)) {
        throw new KinveyError('A tag must be a string.');
      }

      if (!/^[a-zA-Z0-9-]+$/.test(tag)) {
        throw new KinveyError('A tag can only contain letters, numbers, and "-".');
      }

      this.tag = tag;
    }

    /**
     * @type {Client}
     */
    this.client = options.client;

    /**
     * @type {boolean}
     */
    this.useDeltaFetch = options.useDeltaFetch === true;
  }

  /**
   * The client for the store.
   * @return {Client} Client
   */
  get client() {
    if (isDefined(this._client)) {
      return this._client;
    }

    return Client.sharedInstance();
  }

  /**
   * Set the client for the store
   * @param {Client} [client] Client
   */
  set client(client) {
    if (client instanceof Client) {
      this._client = client;
    } else {
      this._client = null;
    }
  }

  /**
   * The pathname for the store.
   * @return  {string}  Pathname
   */
  get pathname() {
    let pathname = `/appdata/${this.client.appKey}`;

    if (this.collection) {
      pathname = `${pathname}/${this.collection}`;
    }

    return pathname;
  }

  /**
   * Find all entities in the data store. A query can be optionally provided to return
   * a subset of all entities in a collection or omitted to return all entities in
   * a collection. The number of entities returned adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                             Query used to filter entities.
   * @param   {Object}                [options]                           Options
   * @param   {Properties}            [options.properties]                Custom properties to send with
   *                                                                      the request.
   * @param   {Number}                [options.timeout]                   Timeout for the request.
   * @param   {Boolean}               [options.useDeltaFetch]             Turn on or off the use of delta fetch.
   * @return  {Observable}                                                Observable.
   */
  find(query, options = {}) {
    const useDeltaFetch = options.useDeltaFetch === true || this.useDeltaFetch;
    const stream = KinveyObservable.create((observer) => {
      // Check that the query is valid
      if (isDefined(query) && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      // Create the request
      const config = {
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: this.pathname
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout,
        client: this.client,
        tag: this.tag
      };
      let request = new KinveyRequest(config);

      // Should we use delta fetch?
      if (useDeltaFetch === true) {
        request = new DeltaFetchRequest(config);
      }

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
    return stream;
  }

  /**
   * Find a single entity in the data store by id.
   *
   * @param   {string}                id                               Entity by id to find.
   * @param   {Object}                [options]                        Options
   * @param   {Properties}            [options.properties]             Custom properties to send with
   *                                                                   the request.
   * @param   {Number}                [options.timeout]                Timeout for the request.
   * @param   {Boolean}               [options.useDeltaFetch]          Turn on or off the use of delta fetch.
   * @return  {Observable}                                             Observable.
   */
  findById(id, options = {}) {
    const useDeltaFetch = options.useDeltaFetch || this.useDeltaFetch;
    const stream = KinveyObservable.create((observer) => {
      if (!id) {
        observer.next(undefined);
        return observer.complete();
      }

      // Fetch data from the network
      const config = {
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `${this.pathname}/${id}`
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client,
        tag: this.tag
      };
      let request = new KinveyRequest(config);

      if (useDeltaFetch === true) {
        request = new DeltaFetchRequest(config);
      }

      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream;
  }

  /**
   * Group entities.
   *
   * @param   {Aggregation}           aggregation                         Aggregation used to group entities.
   * @param   {Object}                [options]                           Options
   * @param   {Properties}            [options.properties]                Custom properties to send with
   *                                                                      the request.
   * @param   {Number}                [options.timeout]                   Timeout for the request.
   * @return  {Observable}                                                Observable.
   */
  group(aggregation, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      // Check that the query is valid
      if (!(aggregation instanceof Aggregation)) {
        return observer.error(new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.'));
      }

      // Create the request
      const request = new KinveyRequest({
        method: RequestMethod.POST,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `${this.pathname}/_group`
        }),
        properties: options.properties,
        aggregation: aggregation,
        timeout: options.timeout,
        client: this.client
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
    return stream;
  }

  /**
   * Count all entities in the data store. A query can be optionally provided to return
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
  count(query, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        // Create the request
        const request = new KinveyRequest({
          method: RequestMethod.GET,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: `${this.pathname}/_count`
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: this.client
        });

        // Execute the request
        return request.execute()
          .then(response => response.data)
          .then(data => observer.next(data ? data.count : 0))
          .then(() => observer.complete())
          .catch(error => observer.error(error));
      } catch (error) {
        return observer.error(error);
      }
    });

    return stream;
  }

  /**
   * Create a single or an array of entities on the data store.
   *
   * @param   {Object}                data                              Data that you want to create on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  create(entity, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      if (isDefined(entity) === false) {
        observer.next(null);
        return observer.complete();
      }

      if (isArray(entity)) {
        return observer.error(new KinveyError(
          'Unable to create an array of entities.',
          'Please create entities one by one.'
        ));
      }

      const request = new KinveyRequest({
        method: RequestMethod.POST,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: this.pathname
        }),
        properties: options.properties,
        data: entity,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream.toPromise();
  }

  /**
   * Update a single or an array of entities on the data store.
   *
   * @param   {Object}          data                                    Data that you want to update on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  update(entity, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      if (isDefined(entity) === false) {
        observer.next(null);
        return observer.complete();
      }

      if (isArray(entity)) {
        return observer.error(new KinveyError(
          'Unable to update an array of entities.',
          'Please update entities one by one.'
        ));
      }

      if (isDefined(entity._id) === false) {
        return observer.error(new KinveyError(
          'Unable to update entity.',
          'Entity must contain an _id to be updated.'
        ));
      }

      const request = new KinveyRequest({
        method: RequestMethod.PUT,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `${this.pathname}/${entity._id}`
        }),
        properties: options.properties,
        data: entity,
        timeout: options.timeout,
        client: this.client
      });
      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream.toPromise();
  }

  /**
   * Save a single or an array of entities on the data store.
   *
   * @param   {Object|Array}          data                              Data that you want to save on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  save(entity, options) {
    if (entity._id) {
      return this.update(entity, options);
    }

    return this.create(entity, options);
  }

  /**
   * Remove all entities in the data store. A query can be optionally provided to remove
   * a subset of all entities in a collection or omitted to remove all entities in
   * a collection. The number of entities removed adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                           Query used to filter entities.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  remove(query, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        const request = new KinveyRequest({
          method: RequestMethod.DELETE,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: this.pathname
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: this.client
        });
        return request.execute()
          .then(response => response.data)
          .then(data => observer.next(data))
          .then(() => observer.complete())
          .catch(error => observer.error(error));
      } catch (error) {
        return observer.error(error);
      }
    });

    return stream.toPromise();
  }

  /**
   * Remove a single entity in the data store by id.
   *
   * @param   {string}                id                               Entity by id to remove.
   * @param   {Object}                [options]                        Options
   * @param   {Properties}            [options.properties]             Custom properties to send with
   *                                                                   the request.
   * @param   {Number}                [options.timeout]                Timeout for the request.
   * @return  {Observable}                                             Observable.
   */
  removeById(id, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      try {
        if (isDefined(id) === false) {
          observer.next(undefined);
          return observer.complete();
        }

        const request = new KinveyRequest({
          method: RequestMethod.DELETE,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: `${this.pathname}/${id}`
          }),
          properties: options.properties,
          timeout: options.timeout
        });
        return request.execute()
          .then(response => response.data)
          .then(data => observer.next(data))
          .then(() => observer.complete())
          .catch(error => observer.error(error));
      } catch (error) {
        return observer.error(error);
      }
    });

    return stream.toPromise();
  }

  /**
   * Subscribes to the live stream for the collection
   */
  subscribe(receiver) {
    const manager = getLiveCollectionManager();
    return manager.subscribeCollection(this.collection, receiver);
  }

  /**
   * Unsubscribes from the live stream for the collection
   */
  unsubscribe() {
    const manager = getLiveCollectionManager();
    return manager.unsubscribeCollection(this.collection);
  }
}
