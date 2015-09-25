import Aggregation from './aggregation';
import KinveyError from './errors/error';
import Request from './request';
import HttpMethod from './enums/httpMethod';
import DataPolicy from './enums/DataPolicy';
import Kinvey from '../kinvey';
import Query from './query';
import AuthType from './enums/authType';
import assign from 'lodash/object/assign';
import log from 'loglevel';
const datastoreNamespace = 'appdata';

/**
 * The Datastore class is used to retrieve, create, update, destroy, count and group documents
 * in collections.
 *
 * @example
 * var datastore = new Kinvey.Datastore();
 */
class Datastore {
  /**
   * Create a new instance of the Datastore class. You can optionally provide a client that
   * will be used to perform all the datastore operations.
   *
   * @param  {Kinvey}       [client=Kinvey.sharedInstance()]            Client
   */
  constructor(client = Kinvey.sharedClientInstance()) {
    /**
     * @type {Kinvey}
     */
    this.client = client;
  }

  /**
   * Finds documents in a collection. A query can be optionally provided to return
   * a subset of all documents in a collection or omitted to return all documents in
   * a collection. The number of documents return will adhere to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
   * promise will be returned that will be resolved with the documents or reject with
   * an error.
   *
   * @param   {string}       collection                                   Collection
   * @param   {Query}        [query]                                      Query
   * @param   {Object}       [options]                                    Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var datastore = new Kinvey.Datastore();
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * datastore.find('books', query).then(function(books) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  find(collection, query, options = {}) {
    log.debug(`Retrieving the documents in the ${collection} collection.`, query);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('query argument must be of type Kinvey.Query'));
    }

    // Create the request path
    const path = `/${datastoreNamespace}/${this.client.appKey}/${collection}`;

    // Create and execute a request
    const request = new Request(HttpMethod.GET, path, query, null, options);
    const promise = request.execute();

    // Log
    promise.then(function(response) {
      log.info(`Retrieved the documents in the ${collection} collection.`, response);
    }).catch(function(err) {
      log.error(`Failed to retrieve the documents in the ${collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Retrieves a single document in a collection by id. A promise will be returned that will
   * be resolved with the document or rejected with an error.
   *
   * @param   {string}       collection                                   Collection
   * @param   {string}       id                                           Document Id
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var datastore = new Kinvey.Datastore();
   * datastore.get('books', '507f191e810c19729de860ea').then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  get(collection, id, options = {}) {
    log.debug(`Retrieving a document in the ${collection} collection with id = ${id}.`);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Create the request path
    const path = `/${datastoreNamespace}/${this.client.appKey}/${collection}/${id}`;

    // Create and execute a request
    const request = new Request(HttpMethod.GET, path, null, null, options);
    const promise = request.execute();

    // Log
    promise.then(function(response) {
      log.info(`Retrieved the document in the ${collection} collection with id = ${id}.`, response);
    }).catch(function(err) {
      log.error(`Failed to retrieve the document in the ${collection} collection with id = ${id}.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Saves a document to a collection. A promise will be returned that will be resolved with
   * saved document or rejected with an error.
   *
   * @param   {string}       collection                                   Collection
   * @param   {string}       doc                                          Document
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var book = { name: 'JavaScript: The Definitive Guide', author: 'David Flanagan' };
   * var datastore = new Kinvey.Datastore();
   * datastore.save('books', book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  save(collection, doc, options = {}) {
    log.debug(`Saving the document to the ${collection} collection.`, doc);

    // If the doc has an _id, perform an update instead
    if (doc._id) {
      log.debug(`The document has an _id = ${doc._id}, updating the document instead.`);
      return this.update(collection, document, options);
    }

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Create the request path
    const path = `/${datastoreNamespace}/${this.client.appKey}/${collection}`;

    // Create and execute a request
    const request = new Request(HttpMethod.POST, path, null, doc, options);
    const promise = request.execute();

    // Log
    promise.then(function(response) {
      log.info(`Saved the document to the ${collection} collection.`, response);
    }).catch(function(err) {
      log.error(`Failed to save the document to the ${collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Updates a document in a collection. A promise will be returned that will be resolved with
   * the updated document or rejected with an error.
   *
   * @param   {string}       collection                                   Collection
   * @param   {string}       doc                                          Document
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var book = { name: 'JavaScript: The Definitive Guide 2.0', author: 'David Flanagan' };
   * var datastore = new Kinvey.Datastore();
   * datastore.update('books', book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  update(collection, doc, options = {}) {
    log.debug(`Update the document to the ${collection} collection.`, doc);

    // Verify the doc contains an _id
    if (!doc._id) {
      return Promise.reject(new KinveyError('The doc argument must contain an _id.'));
    }

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Create the request path
    const path = `/${datastoreNamespace}/${this.client.appKey}/${collection}/${doc._id}`;

    // Create and execute a request
    const request = new Request(HttpMethod.PUT, path, null, doc, options);
    const promise = request.execute();

    // Log
    promise.then(function(response) {
      log.info(`Updated the document to the ${collection} collection.`, response);
    }).catch(function(err) {
      log.error(`Failed to update the document to the ${collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Deletes documents in a collection. A query can be optionally provided to delete
   * a subset of documents in a collection or omitted to delete all documents in a
   * collection. A promise will be returned that will be resolved with a count of the
   * number of documents deleted or rejected with an error.
   *
   * @param   {string}       collection                                   Collection
   * @param   {Query}        [query]                                      Query
   * @param   {Object}       [options]                                    Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var datastore = new Kinvey.Datastore();
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * datastore.clean('books', query).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  clean(collection, query = new Query(), options = {}) {
    log.debug(`Deleting the documents in the ${collection} collection by query.`, query);

    if (!(query instanceof Query)) {
      return Promise.reject(new KinveyError('query argument must be of type Kinvey.Query'));
    }

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Create the request path
    const path = `/${datastoreNamespace}/${this.client.appKey}/${collection}`;

    // Create and execute a request
    const request = new Request(HttpMethod.DELETE, path, query, null, options);
    const promise = request.execute();

    // Log
    promise.then(function(response) {
      log.info(`Deleted the documents in the ${collection} collection.`, response);
    }).catch(function(err) {
      log.error(`Failed to delete the documents in the ${collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Deletes a single document in a collection by id. A promise will be returned that will be
   * resolved with a count of the number of documents deleted or rejected with an error.
   *
   * @param   {string}       collection                                   Collection
   * @param   {string}       id                                           Document Id
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var datastore = new Kinvey.Datastore();
   * datastore.destroy('books', '507f191e810c19729de860ea').then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  destroy(collection, id, options = {}) {
    log.debug(`Deleting a document in the ${collection} collection with id = ${id}.`);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Create the request path
    const path = `/${datastoreNamespace}/${this.client.appKey}/${collection}/${id}`;

    // Create and execute a request
    const request = new Request(HttpMethod.DELETE, path, null, null, options);
    const promise = request.execute();

    // Log
    promise.then(function(response) {
      log.info(`Deleted the document in the ${collection} collection with id = ${id}.`, response);
    }).catch(function(err) {
      log.error(`Failed to delete the document in the ${collection} collection with id = ${id}.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Counts documents in a collection. A query can be optionally provided to count
   * a subset of documents in a collection or omitted to count all the documents
   * in a collection. A promise will be returned that will be resolved with a count
   * of the documents or rejected with an error.
   *
   * @param   {string}       collection                                   Collection
   * @param   {Query}        [query]                                      Query
   * @param   {Object}       [options]                                    Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var datastore = new Kinvey.Datastore();
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'David Flanagan');
   * datastore.count('books', query).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  count(collection, query, options = {}) {
    log.debug(`Counting the number of documents in the ${collection} collection.`, query);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('query argument must be of type Kinvey.Query'));
    }

    // Create the request path
    const path = `/${datastoreNamespace}/${this.client.appKey}/${collection}/_count`;

    // Create and execute a request
    const request = new Request(HttpMethod.GET, path, query, null, options);
    const promise = request.execute();

    // Log
    promise.then(function(response) {
      log.info(`Counted the number of documents in the ${collection} collection.`, response);
    }).catch(function(err) {
      log.error(`Failed to count the number of documents in the ${collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }

  /**
   * Groups documents in a collection. An aggregation can be optionally provided to group
   * a subset of documents in a collection or omitted to group all the documents
   * in a collection. A promise will be returned that will be resolved with all documents
   * in the group or rejected with an error.
   *
   * @param   {string}       collection                                   Collection
   * @param   {Aggregation}  [aggregation]                                Aggregation
   * @param   {Object}       [options]                                    Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.CloudFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var datastore = new Kinvey.Datastore();
   * var aggregation = new Kinvey.Aggregation();
   * datastore.groupd('books', aggregation).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  group(collection, aggregation, options = {}) {
    log.debug(`Grouping the documents in the ${collection} collection.`, aggregation, options);

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Check that the query is an instance of Query
    if (aggregation && !(aggregation instanceof Aggregation)) {
      return Promise.reject(new KinveyError('aggregation argument must be of type Kinvey.Aggregation'));
    }

    // Create the request path
    const path = `/${datastoreNamespace}/${this.client.appKey}/${collection}/_group`;

    // Create and execute a request
    const request = new Request(HttpMethod.POST, path, null, aggregation.toJSON(), options);
    const promise = request.execute();

    // Log
    promise.then(function(response) {
      log.info(`Grouped the documents in the ${collection} collection.`, response);
    }).catch(function(err) {
      log.error(`Failed to group the documents in the ${collection} collection.`, err);
    });

    // Return the promise
    return promise;
  }
}

export default Datastore;
