const Aggregation = require('../aggregation');
const Request = require('../request').Request;
const HttpMethod = require('../enums').HttpMethod;
const DataPolicy = require('../enums').DataPolicy;
const Client = require('../client');
const Query = require('../query');
const Auth = require('../auth');
const Model = require('../models/model');
const assign = require('lodash/object/assign');
const result = require('lodash/object/result');
const forEach = require('lodash/collection/forEach');
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
   * @param  {Client}  Client
   * @return {string}  Path
   */
  getPath(client) {
    client = client || this.client;

    let path = `/${appdataNamespace}/${client.appId}`;

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
      auth: Auth.default,
      client: this.client
    }, options);
    options.method = HttpMethod.GET;
    options.path = this.getPath(options.client);
    options.query = query;

    const request = new Request(options);
    const promise = request.execute().then(response => {
      let data = response.data;
      const models = [];

      if (!isArray(data)) {
        data = [data];
      }

      forEach(data, obj => {
        models.push(new this.model(obj, options)); // eslint-disable-line new-cap
      });

      return models;
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
      auth: Auth.default,
      client: this.client
    }, options);
    options.method = HttpMethod.POST;
    options.path = `${this.getPath(options.client)}/_group`;
    options.data = aggregation.toJSON();

    const request = new Request(options);
    const promise = request.execute().then(response => {
      let data = response.data;
      const models = [];

      if (!isArray(data)) {
        data = [data];
      }

      forEach(data, obj => {
        models.push(new this.model(obj, options)); // eslint-disable-line new-cap
      });

      return models;
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
      auth: Auth.default,
      client: this.client
    }, options);
    options.method = HttpMethod.GET;
    options.path = `${this.getPath(options.client)}/_count`;
    options.query = query;

    const request = new Request(options);
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
      auth: Auth.default,
      client: this.client
    }, options);
    options.method = HttpMethod.GET;
    options.path = `${this.getPath(options.client)}/${id}`;

    const request = new Request(options);
    const promise = request.execute().then(response => {
      return new this.model(response.data, options); // eslint-disable-line new-cap
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
  save(models, options = {}) {
    log.debug(`Saving the models to the ${this.name} collection.`, models);
    let singular = false;

    if (!isArray(models)) {
      models = [models];
      singular = true;
    }

    models = models.map(model => {
      if (!model instanceof this.model) {
        model = new this.model(result(model, 'toJSON', model), options);
      }

      return model;
    });

    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default,
      client: this.client
    }, options);
    options.method = HttpMethod.POST;
    options.path = this.getPath(options.client);
    options.data = models.map(model => {
      return model.toJSON();
    });

    const request = new Request(options);
    const promise = request.execute().then(response => {
      models = response.data.map(data => {
        return new this.model(data, options); // eslint-disable-line new-cap
      });

      return singular && models.length === 1 ? models[0] : models;
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

    if (isArray(model)) {
      log.warn(`Unable to update an array of models. Saving the models instead.`, model);
      return this.save(model, options);
    }

    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default,
      client: this.client
    }, options);
    options.method = HttpMethod.PUT;
    options.path = `${this.getPath(options.client)}/${model.id}`;
    options.data = result(model, 'toJSON', model);

    const request = new Request(options);
    const promise = request.execute().then(response => {
      return new this.model(response.data, options); // eslint-disable-line new-cap
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
      auth: Auth.default,
      client: this.client
    }, options);
    options.method = HttpMethod.DELETE;
    options.path = this.getPath(options.client);
    options.query = query;

    const request = new Request(options);
    const promise = request.execute().then(function(response) {
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
      auth: Auth.default,
      client: this.client
    }, options);
    options.method = HttpMethod.DELETE;
    options.path = `${this.getPath(options.client)}/${id}`;

    const request = new Request(options);
    const promise = request.execute().then(function(response) {
      return response.data;
    });

    promise.then(response => {
      log.info(`Deleted the model in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      log.error(`Failed to delete the model in the ${this.name} collection with id = ${id}.`, err);
    });

    return promise;
  }
}

module.exports = Collection;
