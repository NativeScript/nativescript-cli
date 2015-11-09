/* eslint new-cap: 0 */
const Aggregation = require('../aggregation');
const Request = require('../request').Request;
const HttpMethod = require('../enums/httpMethod');
const DataPolicy = require('../enums/dataPolicy');
const Client = require('../client');
const Query = require('../query');
const Auth = require('../auth');
const Model = require('../models/model');
const assign = require('lodash/object/assign');
const result = require('lodash/object/result');
const log = require('loglevel');
const isArray = require('lodash/lang/isArray');
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

/**
 * The Collection class is used to retrieve, create, update, destroy, count and group documents
 * in collections.
 * a
 * @example
 * var collection = new Kinvey.Collection('books');
 */
class Collection {
  /**
   * Creates a new instance of the Collection class.
   *
   * @param   {string}    [collection]                                Collection
   * @param   {Client}    [client=Client.sharedInstance()]            Client
   */
  constructor(name, options = {}) {
    options = assign({
      client: Client.sharedInstance(),
      model: Model
    }, options);

    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @type {Client}
     */
    this.client = options.client;

    /**
     * @type {Model}
     */
    this.model = options.model;
  }

  /**
   * The path for the collection where requests will be sent.
   *
   * @return   {string}    Path
   */
  get path() {
    let path = `/${appdataNamespace}/${this.client.appId}`;

    if (this.name) {
      path = `${path}/${this.name}`;
    }

    return path;
  }

  /**
   * Finds all models in the collection. A query can be optionally provided to return
   * a subset of all models in the collection or omitted to return all models in
   * the collection. The number of models returned will adhere to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
   * promise will be returned that will be resolved with the models or rejected with
   * an error.
   *
   * @param   {Query}        [query]                                      Query
   * @param   {Object}       [options]                                    Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * collection.find(query).then(function(books) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  find(query, options = {}) {
    log.debug(`Retrieving the models in the ${this.name} collection.`, query);

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.GET;
    options.path = this.path;
    options.query = query;

    const request = new Request(options);
    const promise = request.execute().then(response => {
      let data = response.data;
      const models = [];

      if (!isArray(data)) {
        data = [data];
      }

      data.forEach(doc => {
        models.push(new this.model(doc, options));
      });

      return models;
    });

    promise.then((response) => {
      log.info(`Retrieved the models in the ${this.name} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to retrieve the models in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Retrieves a single model in the collection by id. A promise will be returned that will
   * be resolved with the model or rejected with an error.
   *
   * @param   {string}       id                                           Document Id
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
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
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.GET;
    options.path = `${this.path}/${id}`;

    const request = new Request(options);
    const promise = request.execute().then(response => {
      return new this.model(response.data, options);
    });

    promise.then((response) => {
      log.info(`Retrieved the model in the ${this.name} collection with id = ${id}.`, response);
    }).catch((err) => {
      log.error(`Failed to retrieve the model in the ${this.name} collection with id = ${id}.`, err);
    });

    return promise;
  }

  /**
   * Saves a model to the collection. A promise will be returned that will be resolved with
   * saved model or rejected with an error.
   *
   * @param   {Object}       model                                        Model
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * var book = { name: 'JavaScript: The Definitive Guide', author: 'David Flanagan' };
   * collection.save(book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  save(model, options = {}) {
    log.debug(`Saving the model to the ${this.name} collection.`, model);

    if (model.id) {
      log.debug(`The model has an id = ${model.id}, updating the model instead.`);
      return this.update(model, options);
    }

    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.POST;
    options.path = this.path;
    options.data = result(model, 'toJSON', model);

    const request = new Request(options);
    const promise = request.execute().then(function(response) {
      return new this.model(response.data, options);
    });

    promise.then((response) => {
      log.info(`Saved the model to the ${this.name} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to save the model to the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Updates a model in the collection. A promise will be returned that will be resolved with
   * the updated model or rejected with an error.
   *
   * @param   {string}       model                                        Model
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
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
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.PUT;
    options.path = `${this.path}/${model.id}`;
    options.data = result(model, 'toJSON', model);

    const request = new Request(options);
    const promise = request.execute().then(() => {
      return model;
    });

    promise.then((response) => {
      log.info(`Updated the model to the ${this.name} collection.`, response);
    }).catch((err) => {
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
   * @param   {Query}        [query]                                      Query
   * @param   {Object}       [options]                                    Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * collection.clean(query).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  clean(query, options = {}) {
    log.debug(`Deleting the models in the ${this.name} collection by query.`, query);

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.DELETE;
    options.path = this.path;
    options.query = query;

    const request = new Request(options);
    const promise = request.execute().then(function(response) {
      return response.data;
    });

    promise.then((response) => {
      log.info(`Deleted the models in the ${this.name} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to delete the models in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Delete a model in the collection. A promise will be returned that will be
   * resolved with a count of the number of models deleted or rejected with an error.
   *
   * @param   {string}       id                                           Document Id
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var collection = new Kinvey.Collection('books');
   * collection.destroy('507f191e810c19729de860ea').then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  destroy(id, options = {}) {
    log.debug(`Deleting a model in the ${this.name} collection with id = ${id}.`);

    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.DELETE;
    options.path = `${this.path}/${id}`;

    const request = new Request(options);
    const promise = request.execute().then(function(response) {
      return response.data;
    });

    promise.then((response) => {
      log.info(`Deleted the model in the ${this.name} collection with id = ${id}.`, response);
    }).catch((err) => {
      log.error(`Failed to delete the model in the ${this.name} collection with id = ${id}.`, err);
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
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
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

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.GET;
    options.path = `${this.path}/_count`;
    options.query = query;

    const request = new Request(options);
    const promise = request.execute().then(response => {
      return response.data;
    });

    promise.then((response) => {
      log.info(`Counted the number of models in the ${this.name} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to count the number of models in the ${this.name} collection.`, err);
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
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
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

    if (aggregation && !(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(result(aggregation, 'toJSON', aggregation));
    }

    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.POST;
    options.path = `${this.path}/_group`;
    options.data = aggregation.toJSON();

    const request = new Request(options);
    const promise = request.execute().then(response => {
      return response.data;
    });

    promise.then((response) => {
      log.info(`Grouped the models in the ${this.name} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to group the models in the ${this.name} collection.`, err);
    });

    return promise;
  }
}

module.exports = Collection;
