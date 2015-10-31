import Aggregation from '../aggregation';
import { Request } from '../request';
import HttpMethod from '../enums/httpMethod';
import DataPolicy from '../enums/DataPolicy';
import Client from '../client';
import Query from '../query';
import Auth from '../auth';
import Model from '../models/model';
import assign from 'lodash/object/assign';
import result from 'lodash/object/result';
import log from 'loglevel';
import isArray from 'lodash/lang/isArray';
const datastoreNamespace = 'appdata';

/**
 * The Datastore class is used to retrieve, create, update, destroy, count and group documents
 * in collections.
 * a
 * @example
 * var datastore = new Kinvey.Datastore('books');
 */
export default class Datastore {
  /**
   * Creates a new instance of the Datastore class.
   *
   * @param   {string}    [collection]                                Collection
   * @param   {Client}    [client=Client.sharedInstance()]            Client
   */
  constructor(collection, client = Client.sharedInstance(), options = {}) {
    // Default options
    options = assign({
      model: Model
    }, options);

    /**
     * @type {string}
     */
    this.collection = collection;

    /**
     * @type {Client}
     */
    this.client = client;

    /**
     * @type {Model}
     */
    this.model = options.model;
  }

  /**
   * The path for the datastore where requests will be sent.
   *
   * @return   {string}    Path
   */
  get path() {
    let path = `/${datastoreNamespace}/${this.client.appId}`;

    if (this.collection) {
      path = `${path}/${this.collection}`;
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
   * var datastore = new Kinvey.Datastore('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * datastore.find(query).then(function(books) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  find(query, options = {}) {
    log.debug(`Retrieving the models in the ${this.collection} collection.`, query);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    // Create and execute a request
    const request = new Request(HttpMethod.GET, this.path, query, null, options);
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

    // Log
    promise.then((response) => {
      log.info(`Retrieved the models in the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to retrieve the models in the ${this.collection} collection.`, err);
    });

    // Return the promise
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
   * var datastore = new Kinvey.Datastore('books');
   * datastore.get('507f191e810c19729de860ea').then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  get(id, options = {}) {
    log.debug(`Retrieving a model in the ${this.collection} collection with id = ${id}.`);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);

    // Create and execute a request
    const request = new Request(HttpMethod.GET, `${this.path}/id`, null, null, options);
    const promise = request.execute().then(response => {
      return new this.model(response.data, options);
    });

    // Log
    promise.then((response) => {
      log.info(`Retrieved the model in the ${this.collection} collection with id = ${id}.`, response);
    }).catch((err) => {
      log.error(`Failed to retrieve the model in the ${this.collection} collection with id = ${id}.`, err);
    });

    // Return the promise
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
   * var datastore = new Kinvey.Datastore('books');
   * var book = { name: 'JavaScript: The Definitive Guide', author: 'David Flanagan' };
   * datastore.save(book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  save(model, options = {}) {
    log.debug(`Saving the model to the ${this.collection} collection.`, model);

    // If the doc has an _id, perform an update instead
    if (model.id) {
      log.debug(`The model has an id = ${model.id}, updating the model instead.`);
      return this.update(model, options);
    }

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);

    // Create and execute a request
    const request = new Request(HttpMethod.POST, this.path, null, result(model, 'toJSON', model), options);
    const promise = request.execute().then(function(response) {
      return new this.model(response.data, options);
    });

    // Log
    promise.then((response) => {
      log.info(`Saved the model to the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to save the model to the ${this.collection} collection.`, err);
    });

    // Return the promise
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
   * var datastore = new Kinvey.Datastore('books');
   * var book = { name: 'JavaScript: The Definitive Guide 2.0', author: 'David Flanagan' };
   * datastore.update(book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  update(model, options = {}) {
    log.debug(`Update the model to the ${this.collection} collection.`, model);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);

    // Create and execute a request
    const request = new Request(HttpMethod.PUT, `${this.path}/${model.id}`, null, result(model, 'toJSON', model), options);
    const promise = request.execute().then(() => {
      return model;
    });

    // Log
    promise.then((response) => {
      log.info(`Updated the model to the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to update the model to the ${this.collection} collection.`, err);
    });

    // Return the promise
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
   * var datastore = new Kinvey.Datastore('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * datastore.clean(query).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  clean(query = new Query(), options = {}) {
    log.debug(`Deleting the models in the ${this.collection} collection by query.`, query);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);

    // Create and execute a request
    const request = new Request(HttpMethod.DELETE, this.path, query, null, options);
    const promise = request.execute().then(function(response) {
      return response.data;
    });

    // Log
    promise.then((response) => {
      log.info(`Deleted the models in the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to delete the models in the ${this.collection} collection.`, err);
    });

    // Return the promise
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
   * var datastore = new Kinvey.Datastore('books');
   * datastore.destroy('507f191e810c19729de860ea').then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  destroy(id, options = {}) {
    log.debug(`Deleting a model in the ${this.collection} collection with id = ${id}.`);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);

    // Create and execute a request
    const request = new Request(HttpMethod.DELETE, `${this.path}/${id}`, null, null, options);
    const promise = request.execute().then(function(response) {
      return response.data;
    });

    // Log
    promise.then((response) => {
      log.info(`Deleted the model in the ${this.collection} collection with id = ${id}.`, response);
    }).catch((err) => {
      log.error(`Failed to delete the model in the ${this.collection} collection with id = ${id}.`, err);
    });

    // Return the promise
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
   * var datastore = new Kinvey.Datastore('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * datastore.count(query).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  count(query, options = {}) {
    log.debug(`Counting the number of models in the ${this.collection} collection.`, query);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    // Create and execute a request
    const request = new Request(HttpMethod.GET, `${this.path}/_count`, query, null, options);
    const promise = request.execute().then(response => {
      return response.data;
    });

    // Log
    promise.then((response) => {
      log.info(`Counted the number of models in the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to count the number of models in the ${this.collection} collection.`, err);
    });

    // Return the promise
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
   * var datastore = new Kinvey.Datastore('books');
   * var aggregation = new Kinvey.Aggregation();
   * datastore.groupd(aggregation).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  group(aggregation, options = {}) {
    log.debug(`Grouping the models in the ${this.collection} collection.`, aggregation, options);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      auth: Auth.default
    }, options);

    // Check that the aggregation is an instance of Aggregation
    if (aggregation && !(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(result(aggregation, 'toJSON', aggregation));
    }

    // Create and execute a request
    const request = new Request(HttpMethod.POST, `${this.path}/_group`, null, aggregation.toJSON(), options);
    const promise = request.execute().then(response => {
      return response.data;
    });

    // Log
    promise.then((response) => {
      log.info(`Grouped the models in the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to group the models in the ${this.collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }
}
