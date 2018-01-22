import { Promise } from 'es6-promise';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import assign from 'lodash/assign';
import url from 'url';

import { KinveyRequest, AuthType, RequestMethod } from '../request';
import { KinveyError } from '../errors';
import { Query } from '../query';
import { Client } from '../client';
import { isDefined, isPromiseLike, isObservable } from '../utils';
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

  constructor(collection, processor, options = {}) {
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
    const errPromise = this._validateQuery(query);
    if (errPromise) {
      return wrapInObservable(errPromise);
    }

    options = assign({ useDeltaFetch: this.useDeltaFetch }, options);
    const operation = this._buildOperationObject(OperationType.Read, query);
    const opPromise = this._executeOperation(operation, options);
    return this._ensureObservable(opPromise);
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
    if (!id) {
      return wrapInObservable((observer) => {
        observer.next(undefined); // TODO: decide on this behaviour
        observer.complete();
      });
    }

    const operation = this._buildOperationObject(OperationType.ReadById, null, null, id);
    const entityPromise = this._executeOperation(operation, options);
    return this._ensureObservable(entityPromise);
  }

  /**
   * Group entities.
   *
   * @param   {Aggregation}           aggregationQuery                         Aggregation used to group entities.
   * @param   {Object}                [options]                           Options
   * @param   {Properties}            [options.properties]                Custom properties to send with
   *                                                                      the request.
   * @param   {Number}                [options.timeout]                   Timeout for the request.
   * @return  {Observable}                                                Observable.
   */
  group(aggregationQuery, options = {}) {
    const validationError = this._validateAggregationQuery(aggregationQuery);
    if (validationError) {
      return this._ensureObservable(validationError);
    }

    const operation = this._buildOperationObject(OperationType.Group, aggregationQuery);
    const resultPromise = this._executeOperation(operation, options);
    return this._ensureObservable(resultPromise);
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
    const errPromise = this._validateQuery(query);
    if (errPromise) {
      return wrapInObservable(errPromise);
    }

    const operation = this._buildOperationObject(OperationType.Count, query);
    const opPromise = this._executeOperation(operation, options);
    return this._ensureObservable(opPromise);
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
    // TODO: decide on this behaviour
    if (!isDefined(entity)) {
      return Promise.resolve(null);
    }

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
      const errMsg = 'The entity provided does not contain an _id. An _id is required to update the entity.';
      return Promise.reject(new KinveyError(errMsg, entity));
    }

    const operation = this._buildOperationObject(OperationType.Update, null, entity);
    const opPromise = this._executeOperation(operation, options);
    return this._ensurePromise(opPromise);
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
    const errPromise = this._validateQuery(query);
    if (errPromise) {
      return errPromise;
    }

    const operation = this._buildOperationObject(OperationType.Delete, query);
    const opPromise = this._executeOperation(operation, options)
      .then(count => ({ count }));

    return this._ensurePromise(opPromise);
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
    // TODO: this should be the behaviour, I think
    // if (!id) {
    //   return Promise.reject(new KinveyError('Invalid or missing id'));
    // }
    if (!isDefined(id)) {
      return Promise.resolve(undefined);
    }

    const operation = this._buildOperationObject(OperationType.DeleteById, null, null, id);
    return this._executeOperation(operation, options)
      .then(count => ({ count }));
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

  _validateQuery(query) {
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Query class.'));
    }
    return null;
  }

  _validateAggregationQuery(aggregationQuery) {
    if (!(aggregationQuery instanceof Aggregation)) {
      return Promise.reject(new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.'));
    }
    return null;
  }

  _buildOperationObject(type, query, data, id) {
    // TODO: op factory?
    return new Operation(type, this.collection, query, data, id);
  }

  _executeOperation(operation, options) {
    return this._processor.process(operation, options);
  }

  // private

  _ensureObservable(promiseOrObservable) {
    if (isPromiseLike(promiseOrObservable)) {
      return wrapInObservable(promiseOrObservable);
    } else if (isObservable(promiseOrObservable)) {
      return promiseOrObservable;
    }
    throw new KinveyError('Unexpected result type.'); // should not happen
  }

  _ensurePromise(object) {
    if (isPromiseLike(object)) {
      return object;
    }
    throw new KinveyError('Unexpected result type.'); // should not happen
  }
}
