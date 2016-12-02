import { DeltaFetchRequest, KinveyRequest, AuthType, RequestMethod } from '../../request';
import { KinveyError } from '../../errors';
import Query from '../../query';
import { Client } from '../../client';
import { KinveyObservable, Log, isDefined } from '../../utils';
import Aggregation from '../../aggregation';
import Promise from 'es6-promise';
import isString from 'lodash/isString';
import url from 'url';
import map from 'lodash/map';
import isArray from 'lodash/isArray';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

/**
 * The NetworkStore class is used to find, create, update, remove, count and group entities over the network.
 */
export default class NetworkStore {
  constructor(collection, options = {}) {
    if (collection && !isString(collection)) {
      throw new KinveyError('Collection must be a string.');
    }

    /**
     * @type {string}
     */
    this.collection = collection;

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
    let pathname = `/${appdataNamespace}/${this.client.appKey}`;

    if (this.collection) {
      pathname = `${pathname}/${this.collection}`;
    }

    return pathname;
  }

  /**
   * Returns the live stream for the store.
   * @return {Observable} Observable
   */
  get liveStream() {
    if (typeof EventSource === 'undefined') {
      throw new KinveyError('Your environment does not support server-sent events.');
    }

    if (!this._liveStream) {
      // Subscribe to KLS
      const source = new EventSource(url.format({
        protocol: this.client.liveServiceProtocol,
        host: this.client.liveServiceHost,
        pathname: this.pathname,
      }));

       // Create a live stream
      this._liveStream = KinveyObservable.create((observer) => {
        // Open event
        source.onopen = (event) => {
          Log.info(`Subscription to Kinvey Live Service is now open at ${source.url}.`);
          Log.info(event);
        };

        // Message event
        source.onmessage = (message) => {
          try {
            observer.next(JSON.parse(message.data));
          } catch (error) {
            observer.error(error);
          }
        };

        // Error event
        source.onerror = (error) => {
          observer.error(error);
        };

        // Dispose function
        return () => {
          observer.complete();
        };
      }).finally(() => {
        source.close();
        delete this._liveStream;
      });
    }

    // Return the stream
    return this._liveStream;
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
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname,
          query: options.query
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout,
        client: this.client
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
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this.pathname}/${id}`,
          query: options.query
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
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
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `${this.pathname}/_group`,
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
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: `${this.pathname}/_count`,
            query: options.query
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
   * @param   {Object|Array}          data                              Data that you want to create on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  create(entities, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      try {
        if (!entities) {
          observer.next(null);
          return observer.complete();
        }

        let singular = false;

        if (!isArray(entities)) {
          singular = true;
          entities = [entities];
        }

        return Promise.all(map(entities, (entity) => {
          const request = new KinveyRequest({
            method: RequestMethod.POST,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: this.pathname,
              query: options.query
            }),
            properties: options.properties,
            data: entity,
            timeout: options.timeout,
            client: this.client
          });
          return request.execute();
        }))
          .then(responses => map(responses, response => response.data))
          .then(data => observer.next(singular ? data[0] : data))
          .then(() => observer.complete())
          .catch(error => observer.error(error));
      } catch (error) {
        return observer.error(error);
      }
    });

    return stream.toPromise();
  }

  /**
   * Update a single or an array of entities on the data store.
   *
   * @param   {Object|Array}          data                              Data that you want to update on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  update(entities, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      try {
        if (!entities) {
          observer.next(null);
          return observer.complete();
        }

        let singular = false;

        if (!isArray(entities)) {
          singular = true;
          entities = [entities];
        }

        return Promise.all(map(entities, (entity) => {
          const request = new KinveyRequest({
            method: RequestMethod.PUT,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this.pathname}/${entity._id}`,
              query: options.query
            }),
            properties: options.properties,
            data: entity,
            timeout: options.timeout,
            client: this.client
          });
          return request.execute();
        }))
          .then(responses => map(responses, response => response.data))
          .then(data => observer.next(singular ? data[0] : data))
          .then(() => observer.complete())
          .catch(error => observer.error(error));
      } catch (error) {
        return observer.error(error);
      }
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
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: this.pathname,
            query: options.query
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
        if (!id) {
          observer.next(undefined);
          return observer.complete();
        }

        const request = new KinveyRequest({
          method: RequestMethod.DELETE,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: `${this.pathname}/${id}`,
            query: options.query
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
   * Subscribes to a live stream
   */
  subscribe(onNext, onError, onComplete) {
    return this.liveStream.subscribe(onNext, onError, onComplete);
  }
}
