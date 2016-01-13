const Aggregation = require('../aggregation');
const Promise = require('bluebird');
const DeltaSetRequest = require('../requests/deltaSetRequest');
const HttpMethod = require('../enums').HttpMethod;
const NotFoundError = require('../errors').NotFoundError;
const Client = require('../client');
const Query = require('../query');
const Auth = require('../auth');
const Model = require('../models/model');
const assign = require('lodash/object/assign');
const result = require('lodash/object/result');
const forEach = require('lodash/collection/forEach');
const log = require('../log');
const isArray = require('lodash/lang/isArray');
const isString = require('lodash/lang/isString');
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

/**
 * The Store class is used to retrieve, create, update, destroy, count and group documents
 * in collections.
 *
 * @example
 * var store = new Kinvey.Store('books');
 */
class Store {
  /**
   * Creates a new instance of the Store class.
   *
   * @param {string}      name                                                Name of the collection
   * @param {Object}      [options]                                           Options
   * @param {Auth}        [options.auth=Auth.default]                         Auth function to use to set the
   *                                                                          authorization header for requests.
   * @param {Client}      [options.client=Client.sharedInstance()]            Client to use for sending requests
   *                                                                          for data.
   * @param {Model}       [options.modelClass=Model]                          Model Class to instantiate with returned
   *                                                                          data.
   * @param {Number}      [options.ttl=undefined]                             TTL for data returned from cache.
   */
  constructor(name, options = {}) {
    options = assign({
      auth: Auth.default,
      client: Client.sharedInstance(),
      modelClass: Model,
      ttl: undefined
    }, options);

    if (name && !isString(name)) {
      throw new Error('Name must be a string.');
    }

    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @type {Auth}
     */
    this.auth = options.auth;

    /**
     * @type {Client}
     */
    this.client = options.client;

    /**
     * @type {Model}
     */
    this.modelClass = options.modelClass;

    /**
     * @type {Number}
     */
    this.ttl = options.ttl;
  }

  /**
   * The pathname for the collection where requests will be sent.
   *
   * @param  {Client}  Client
   * @return {string}  Path
   */
  getPathname(client) {
    client = client || this.client;

    let pathname = `/${appdataNamespace}/${client.appId}`;

    if (this.name) {
      pathname = `${pathname}/${this.name}`;
    }

    return pathname;
  }

  /**
   * Finds all models in the collection. A query can be optionally provided to return
   * a subset of all models in the collection or omitted to return all models in
   * the collection. The number of models returned will adhere to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
   * promise will be returned that will be resolved with the models or rejected with
   * an error.
   *
   * @param {Query}     [query]                                        Query
   * @param {Object}    [options]                                      Options
   * @param {Auth}      [options.auth=Auth.default]                    Auth function to use to set the
   *                                                                   authorization header for requests.
   * @param {Client}    [options.client=Client.sharedInstance()]       Client to use for sending requests
   *                                                                   for data.
   * @param {Number}    [options.ttl]                                  TTL for data returned from cache.
   * @return {Promise}                                                 Promise
   *
   * @example
   * var store = new Kinvey.Store('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'Kinvey');
   * store.find(query).then(function(books) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  find(query, options = {}) {
    log.debug(`Retrieving the models in the ${this.name} collection.`, query);

    options = assign({
      client: this.client,
      properties: null,
      headers: null,
      auth: this.auth,
      flags: null,
      timeout: undefined,
      ttl: this.ttl,
    }, options);

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    const request = new DeltaSetRequest({
      method: HttpMethod.GET,
      client: options.client,
      properties: options.properties,
      headers: options.headers,
      auth: options.auth,
      flags: options.flags,
      query: query,
      timeout: options.timeout
    });
    const promise = request.execute().then(response => {
      if (response && response.isSuccess()) {
        let data = response.data;
        const models = [];

        if (data) {
          if (!isArray(data)) {
            data = [data];
          }

          forEach(data, doc => {
            if (doc) {
              models.push(new this.modelClass(doc, options)); // eslint-disable-line new-cap
            }
          });
        }

        return models;
      }

      return response;
    });

    promise.then(response => {
      log.info(`Retrieved the models in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to retrieve the models in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Groups models in the collection. An aggregation can be optionally provided to group
   * a subset of models in the collection or omitted to group all the models
   * in the collection. A promise will be returned that will be resolved with all models
   * in the group or rejected with an error.
   *
   * @param   {Aggregation}  [aggregation]                                Aggregation
   * @param   {Object}       [options]                                    Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.NetworkFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * var aggregation = new Kinvey.Aggregation();
   * collection.group(aggregation).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  group(aggregation, options = {}) {
    log.debug(`Grouping the models in the ${this.name} collection.`, aggregation, options);

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      ttl: this.ttl
    }, options);

    if (!(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(result(aggregation, 'toJSON', aggregation));
    }

    const request = new DeltaSetRequest({
      dataPolicy: options.dataPolicy,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.GET,
      pathname: `${this.getPathname(options.client)}/_group`,
      data: aggregation.toJSON(),
      ttl: options.ttl
    });
    const promise = request.execute().then(response => {
      return response.data;
    });

    promise.then(response => {
      log.info(`Grouped the models in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to group the models in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Counts models in the collection. A query can be optionally provided to count
   * a subset of models in the collection or omitted to count all the models
   * in a collection. A promise will be returned that will be resolved with a count
   * of the models or rejected with an error.
   *
   * @param   {Query}        [query]                                      Query
   * @param   {Object}       [options]                                    Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.NetworkFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * collection.count(query).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  count(query, options = {}) {
    log.debug(`Counting the number of models in the ${this.name} collection.`, query);

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      ttl: this.ttl,
    }, options);

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    const request = new DeltaSetRequest({
      dataPolicy: options.dataPolicy,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.GET,
      pathname: `${this.getPathname(options.client)}/_count`,
      query: query,
      ttl: options.ttl
    });
    const promise = request.execute().then(response => {
      return response.data;
    });

    promise.then(response => {
      log.info(`Counted the number of models in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to count the number of models in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Retrieves a single model in the collection by id. A promise will be returned that will
   * be resolved with the model or rejected with an error.
   *
   * @param   {string}       id                                           Document Id
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.NetworkFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * collection.get('507f191e810c19729de860ea').then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  get(id, options = {}) {
    log.debug(`Retrieving a model in the ${this.name} collection with id = ${id}.`);

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      ttl: this.ttl
    }, options);

    const request = new DeltaSetRequest({
      dataPolicy: options.dataPolicy,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.GET,
      pathname: `${this.getPathname(options.client)}/${id}`,
      ttl: options.ttl
    });
    const promise = request.execute().then(response => {
      const data = response.data;
      return new this.model(data, options); // eslint-disable-line new-cap
    });

    promise.then(response => {
      log.info(`Retrieved the model in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      log.error(`Failed to retrieve the model in the ${this.name} collection with id = ${id}.`, err);
    });

    return promise;
  }

  /**
   * Saves a model to the collection. A promise will be returned that will be resolved with
   * saved model or rejected with an error.
   *
   * @param   {Model}        model                                              Model
   * @param   {Object}       options                                            Options
   * @param   {DataPolicy}   [options.writePolicy=WritePolicy.WriteAutomatic]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]                Auth type
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * var book = { name: 'JavaScript: The Definitive Guide', author: 'David Flanagan' };
   * collection.create(book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  create(model, options = {}) {
    log.debug(`Saving the model to the ${this.name} collection.`, model);

    options = assign({
      writePolicy: this.writePolicy,
      auth: this.auth,
      client: this.client
    }, options);

    if (!model) {
      log.warn('No model was provided to be saved.', model);
      return Promise.resolve(null);
    }

    if (!(model instanceof this.model)) {
      model = new this.model(result(model, 'toJSON', model), options); // eslint-disable-line new-cap
    }

    if (!model.isNew()) {
      log.warn('The model is not new. Updating the model.', model);
      return this.update(model, options);
    }

    const data = model.toJSON();
    delete data._id;

    const request = new Request({
      writePolicy: options.writePolicy,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.POST,
      pathname: this.getPathname(options.client),
      data: data
    });
    const promise = request.execute().then(response => {
      const data = response.data;
      return new this.model(data, options); // eslint-disable-line new-cap
    });

    promise.then(response => {
      log.info(`Saved the model to the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to save the model to the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Updates a model in the collection. A promise will be returned that will be resolved with
   * the updated model or rejected with an error.
   *
   * @param   {Object}       model                                              Model
   * @param   {Object}       options                                            Options
   * @param   {WritePolicy}  [options.writePolicy=WritePolicy.WriteAutomatic]   Write policy
   * @param   {AuthType}     [options.authType=AuthType.Default]                Auth type
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * var book = { name: 'JavaScript: The Definitive Guide 2.0', author: 'David Flanagan' };
   * collection.update(book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  update(model, options = {}) {
    log.debug(`Update the model to the ${this.name} collection.`, model);

    options = assign({
      writePolicy: this.writePolicy,
      auth: this.auth,
      client: this.client
    }, options);

    if (!model) {
      log.warn('No model was provided to be updated.', model);
      return Promise.resolve(null);
    }

    if (!(model instanceof this.model)) {
      model = new this.model(result(model, 'toJSON', model), options); // eslint-disable-line new-cap
    }

    if (model.isNew()) {
      log.warn('The model is new. Creating the model.', model);
      return this.create(model, options);
    }

    const request = new Request({
      writePolicy: options.writePolicy,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.PUT,
      pathname: `${this.getPathname(options.client)}/${model.id}`,
      data: model.toJSON()
    });
    const promise = request.execute().then(response => {
      const data = response.data;
      return new this.model(data, options); // eslint-disable-line new-cap
    });

    promise.then(response => {
      log.info(`Updated the model to the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to update the model to the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Delete models in the collection. A query can be optionally provided to delete
   * a subset of modsels in the collection or omitted to delete all models in the
   * collection. A promise will be returned that will be resolved with a count of the
   * number of models deleted or rejected with an error.
   *
   * @param   {Query}        [query]                                            Query
   * @param   {Object}       [options]                                          Options
   * @param   {WritePolicy}  [options.writePolicy=WritePolicy.WriteAutomatic]   Write policy
   * @param   {AuthType}     [options.authType=AuthType.Default]                Auth type
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * collection.clear(query).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  clear(query, options = {}) {
    log.debug(`Deleting the models in the ${this.name} collection by query.`, query);

    options = assign({
      writePolicy: this.writePolicy,
      auth: this.auth,
      client: this.client
    }, options);

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    const request = new Request({
      writePolicy: options.writePolicy,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.DELETE,
      pathname: this.getPathname(options.client),
      query: query
    });
    const promise = request.execute().then(response => {
      return response.data;
    });

    promise.then(response => {
      log.info(`Deleted the models in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to delete the models in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Delete a model in the collection. A promise will be returned that will be
   * resolved with a count of the number of models deleted or rejected with an error.
   *
   * @param   {string}       id                                                 Document Id
   * @param   {Object}       options                                            Options
   * @param   {WritePolicy}  [options.writePolicy=WritePolicy.WriteAutomatic]   Write policy
   * @param   {AuthType}     [options.authType=AuthType.Default]                Auth type
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * collection.Delete('507f191e810c19729de860ea').then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  delete(id, options = {}) {
    log.debug(`Deleting a model in the ${this.name} collection with id = ${id}.`);

    options = assign({
      writePolicy: this.writePolicy,
      auth: this.auth,
      client: this.client,
      silent: false
    }, options);

    const request = new Request({
      writePolicy: options.writePolicy,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.DELETE,
      pathname: `${this.getPathname(options.client)}/${id}`
    });
    const promise = request.execute().then(response => {
      return response.data;
    }).catch(err => {
      if (options.silent && err instanceof NotFoundError) {
        log.debug(`A model with id = ${id} does not exist. Returning success because of the silent flag.`);
        return {
          count: 0,
          documents: []
        };
      }

      throw err;
    });

    promise.then(response => {
      log.info(`Deleted the model in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      log.error(`Failed to delete the model in the ${this.name} collection with id = ${id}.`, err);
    });

    return promise;
  }
}

module.exports = Store;
