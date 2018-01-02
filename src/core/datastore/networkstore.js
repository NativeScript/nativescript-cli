import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import url from 'url';

import { KinveyRequest, AuthType, RequestMethod } from '../request';
import { KinveyError } from '../errors';
import { Query } from '../query';
import { Client } from '../client';
import { isDefined } from '../utils';
import { KinveyObservable, wrapInObservable } from '../observable';
import { Aggregation } from '../aggregation';
import { getLiveCollectionManager } from '../live';

import { Operation, OperationType } from './operations';
import { processorFactory } from './processors';

/**
 * The NetworkStore class is used to find, create, update, remove, count and group entities over the network.
 */
export class NetworkStore {
  /** @type {CacheOperator} */
  _processor;

  constructor(collection, options = {}, processor) {
    this._processor = processor || processorFactory.getNetworkProcessor();

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
    const errPromise = this._ensureValidQuery(query);
    if (errPromise) {
      return wrapInObservable(errPromise);
    }

    const operation = this._buildOperationObject(OperationType.Read, query);
    const opPromise = this._executeOperation(operation, options);
    return wrapInObservable(opPromise);
  }

  _buildOperationObject(type, query, data, id) {
    // TODO: op factory?
    return new Operation(type, this.collection, query, data, id);
  }

  _executeOperation(operation, options) {
    return this._processor.process(operation, options);
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
    const operation = this._buildOperationObject(OperationType.ReadById, null, null, id);
    const entityPromise = this._executeOperation(operation, options);
    return wrapInObservable(entityPromise);
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
    const errPromise = this._ensureValidQuery(query);
    if (errPromise) {
      return wrapInObservable(errPromise);
    }

    const operation = this._buildOperationObject(OperationType.Count, query);
    const opPromise = this._executeOperation(operation, options);
    return wrapInObservable(opPromise);
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
    // TODO: decide what to do about this old code
    //   if (isDefined(entity) === false) {
    //     observer.next(null);
    //     return observer.complete();
    //   }

    if (isArray(entity)) {
      return Promise.reject(new KinveyError(
        'Unable to create an array of entities.',
        'Please create entities one by one.'
      ));
    }

    const operation = this._buildOperationObject(OperationType.Create, null, entity);
    return this._executeOperation(operation, options);
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
    if (!isDefined(entity)) {
      return Promise.resolve(null); // TODO: really?
    }

    if (isArray(entity)) {
      const err = new KinveyError('Unable to update an array of entities.', 'Please update entities one by one.');
      return Promise.reject(err);
    }

    if (!isDefined(entity._id)) {
      const err = new KinveyError('Unable to update entity.', 'Entity must contain an _id to be updated.');
      return Promise.reject(err);
    }

    const operation = this._buildOperationObject(OperationType.Update, null, entity);
    return this._executeOperation(operation, options);
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
    const errPromise = this._ensureValidQuery(query);
    if (errPromise) {
      return errPromise;
    }

    const operation = this._buildOperationObject(OperationType.Delete, query);
    return this._executeOperation(operation, options);
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
    if (!isDefined(id)) {
      return Promise.resolve(undefined); // TODO: decide on this
    }

    const operation = this._buildOperationObject(OperationType.DeleteById, null, null, id);
    return this._executeOperation(operation, options);
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

  // protected

  _ensureValidQuery(query) {
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Query class.'));
    }
    return null;
  }
}
