import Aggregation from '../aggregation';
import KinveyError from '../errors/error';
import Request from '../request';
import HttpMethod from '../enums/httpMethod';
import DataPolicy from '../enums/DataPolicy';
import Client from '../client';
import Query from '../query';
import Auth from '../auth';
import assign from 'lodash/object/assign';
import log from 'loglevel';
import isFunction from 'lodash/lang/isFunction';
const datastoreNamespace = 'appdata';
const pathReplaceRegex = /[^\/]$/;

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
  constructor(collection, client = Client.sharedInstance()) {
    /**
     * @type {string}
     */
    this.collection = collection;

    /**
     * @type {Client}
     */
    this.client = client;
  }

  /**
   * The path for the datastore where requests will be sent.
   *
   * @return   {string}    Path
   */
  get path() {
    let path = `/${datastoreNamespace}/${this.client.appKey}`;

    if (this.collection) {
      path = `${path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent(this.collection)}`;
    }

    return path;
  }

  /**
   * Finds all documents in the collection. A query can be optionally provided to return
   * a subset of all documents in the collection or omitted to return all documents in
   * the collection. The number of documents returned will adhere to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
   * promise will be returned that will be resolved with the documents or rejected with
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
    log.debug(`Retrieving the documents in the ${this.collection} collection.`, query);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      query = new Query(isFunction(query.toJSON) ? query.toJSON() : query);
    }

    // Create and execute a request
    const request = new Request(HttpMethod.GET, this.path, query, null, options);
    const promise = request.execute().then(function(response) {
      return response.data;
    });

    // Log
    promise.then((response) => {
      log.info(`Retrieved the documents in the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to retrieve the documents in the ${this.collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Retrieves a single document in the collection by id. A promise will be returned that will
   * be resolved with the document or rejected with an error.
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
    log.debug(`Retrieving a document in the ${this.collection} collection with id = ${id}.`);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Create the request path
    const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent(id)}`;

    // Create and execute a request
    const request = new Request(HttpMethod.GET, path, null, null, options);
    const promise = request.execute();

    // Log
    promise.then((response) => {
      log.info(`Retrieved the document in the ${this.collection} collection with id = ${id}.`, response);
    }).catch((err) => {
      log.error(`Failed to retrieve the document in the ${this.collection} collection with id = ${id}.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Saves a document to the collection. A promise will be returned that will be resolved with
   * saved document or rejected with an error.
   *
   * @param   {Object}       doc                                          Document
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
  save(doc, options = {}) {
    log.debug(`Saving the document to the ${this.collection} collection.`, doc);

    // If the doc has an _id, perform an update instead
    if (doc._id) {
      log.debug(`The document has an _id = ${doc._id}, updating the document instead.`);
      return this.update(doc, options);
    }

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Create and execute a request
    const request = new Request(HttpMethod.POST, this.path, null, doc, options);
    const promise = request.execute().then(function(response) {
      return response.data;
    });

    // Log
    promise.then((response) => {
      log.info(`Saved the document to the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to save the document to the ${this.collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Updates a document in the collection. A promise will be returned that will be resolved with
   * the updated document or rejected with an error.
   *
   * @param   {string}       doc                                          Document
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
  update(doc, options = {}) {
    log.debug(`Update the document to the ${this.collection} collection.`, doc);

    // Verify the doc contains an _id
    if (!doc._id) {
      return Promise.reject(new KinveyError('The doc argument must contain an _id.'));
    }

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Create the request path
    const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent(doc._id)}`;

    // Create and execute a request
    const request = new Request(HttpMethod.PUT, path, null, doc, options);
    const promise = request.execute();

    // Log
    promise.then((response) => {
      log.info(`Updated the document to the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to update the document to the ${this.collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Delete documents in the collection. A query can be optionally provided to delete
   * a subset of documents in the collection or omitted to delete all documents in the
   * collection. A promise will be returned that will be resolved with a count of the
   * number of documents deleted or rejected with an error.
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
    log.debug(`Deleting the documents in the ${this.collection} collection by query.`, query);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      query = new Query(isFunction(query.toJSON) ? query.toJSON() : query);
    }

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Create and execute a request
    const request = new Request(HttpMethod.DELETE, this.path, query, null, options);
    const promise = request.execute();

    // Log
    promise.then((response) => {
      log.info(`Deleted the documents in the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to delete the documents in the ${this.collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Delete a document in the collection. A promise will be returned that will be
   * resolved with a count of the number of documents deleted or rejected with an error.
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
    log.debug(`Deleting a document in the ${this.collection} collection with id = ${id}.`);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Create the request path
    const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent(id)}`;

    // Create and execute a request
    const request = new Request(HttpMethod.DELETE, path, null, null, options);
    const promise = request.execute();

    // Log
    promise.then((response) => {
      log.info(`Deleted the document in the ${this.collection} collection with id = ${id}.`, response);
    }).catch((err) => {
      log.error(`Failed to delete the document in the ${this.collection} collection with id = ${id}.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Counts documents in the collection. A query can be optionally provided to count
   * a subset of documents in the collection or omitted to count all the documents
   * in a collection. A promise will be returned that will be resolved with a count
   * of the documents or rejected with an error.
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
    log.debug(`Counting the number of documents in the ${this.collection} collection.`, query);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      query = new Query(isFunction(query.toJSON) ? query.toJSON() : query);
    }

    // Create the request path
    const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent('_count')}`;

    // Create and execute a request
    const request = new Request(HttpMethod.GET, path, query, null, options);
    const promise = request.execute();

    // Log
    promise.then((response) => {
      log.info(`Counted the number of documents in the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to count the number of documents in the ${this.collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Groups documents in the collection. An aggregation can be optionally provided to group
   * a subset of documents in the collection or omitted to group all the documents
   * in the collection. A promise will be returned that will be resolved with all documents
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
    log.debug(`Grouping the documents in the ${this.collection} collection.`, aggregation, options);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Check that the aggregation is an instance of Aggregation
    if (aggregation && !(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(isFunction(aggregation.toJSON) ? aggregation.toJSON() : aggregation);
    }

    // Create the request path
    const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent('_group')}`;

    // Create and execute a request
    const request = new Request(HttpMethod.POST, path, null, aggregation.toJSON(), options);
    const promise = request.execute();

    // Log
    promise.then((response) => {
      log.info(`Grouped the documents in the ${this.collection} collection.`, response);
    }).catch((err) => {
      log.error(`Failed to group the documents in the ${this.collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }
}
