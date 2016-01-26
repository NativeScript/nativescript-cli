import Aggregation from '../aggregation';
import DeltaSetRequest from '../requests/deltaSetRequest';
import NetworkRequest from '../requests/networkRequest';
import LocalRequest from '../requests/localRequest';
import Response from '../requests/response';
import { HttpMethod, StatusCode, StoreType, ReadPolicy, WritePolicy } from '../enums';
import { KinveyError, NotFoundError } from '../errors';
import Client from '../client';
import Query from '../query';
import Auth from '../auth';
import assign from 'lodash/object/assign';
import result from 'lodash/object/result';
import forEach from 'lodash/collection/forEach';
import clone from 'lodash/lang/clone';
import map from 'lodash/collection/map';
import log from '../log';
import find from 'lodash/collection/find';
import isArray from 'lodash/lang/isArray';
import isString from 'lodash/lang/isString';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';
const localIdPrefix = process.env.KINVEY_ID_PREFIX || 'local_';

/**
 * The Store class is used to retrieve, create, update, delete, count and group documents
 * in a collection.
 *
 * @example
 * var store = Kinvey.Store.getInstance('books');
 */
export default class Store {
  /**
   * Creates a new instance of the Store class.
   *
   * @param   {string}  name   Name of the collection
   *
   * @throws  {KinveyError}   If the name provided is not a string.
   */
  constructor(name) {
    if (name && !isString(name)) {
      throw new KinveyError('Name must be a string.');
    }

    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @type {ReadPolicy} readPolicy=ReadPolicy.NetworkOnly
     */
    this.readPolicy = ReadPolicy.NetworkOnly;

    /**
     * @type {WritePolicy} writePolicy=WritePolicy.NetworkOnly
     */
    this.writePolicy = WritePolicy.NetworkOnly;

    /**
     * @type {Auth} auth=Auth.default
     */
    this.auth = Auth.default;

    /**
     * @type {Client} client=Client.sharedInstance()
     */
    this.client = Client.sharedInstance();

    /**
     * @type {Number} ttl=undefined
     */
    this.ttl = undefined;
  }

  /**
   * The pathname for the store.
   *
   * @param   {Client}   [client]     Client
   * @return  {string}                Pathname
   */
  getPathname(client) {
    client = client || this.client;
    let pathname = `/${appdataNamespace}/${client.appKey}`;

    if (this.name) {
      pathname = `${pathname}/${this.name}`;
    }

    return pathname;
  }

  /**
   * The sync pathname for the store.
   *
   * @param   {Client}   [client]     Client
   * @return  {string}                Sync pathname
   */
  _getSyncPathname(client) {
    if (!this.name) {
      throw new Error('Unable to get a sync pathname for a collection with no name.');
    }

    client = client || this.client;
    return `/${appdataNamespace}/${client.appKey}/${syncCollectionName}/${this.name}`;
  }

  /**
   * Finds all documents in a collection. A query can be optionally provided to return
   * a subset of all documents in a collection or omitted to return all documents in
   * a collection. The number of documents returned will adhere to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
   * promise will be returned that will be resolved with the documents or rejected with
   * an error.
   *
   * @param   {Query}                 [query]                                   Query used to filter result.
   * @param   {Object}                [options]                                 Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the local cache.
   * @param   {ReadPolicy}            [options.readPolicy]                      Read policy to use for fetching
   *                                                                            the data.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * var query = new Query();
   * query.equalTo('author', 'Kinvey');
   * store.find(query).then(function(books) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  find(query, options = {}) {
    log.debug(`Retrieving the documents in the ${this.name} collection.`, query);

    options = assign({
      auth: this.auth,
      client: this.client,
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      readPolicy: this.readPolicy,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      let request;
      const requestOptions = {
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: this.getPathname(options.client),
        query: query,
        timeout: options.timeout
      };

      switch (options.readPolicy) {
        case ReadPolicy.LocalOnly:
          request = new LocalRequest(requestOptions);
          break;
        case ReadPolicy.NetworkOnly:
          request = new NetworkRequest(requestOptions);
          break;
        case ReadPolicy.LocalFirst:
        default:
          request = new DeltaSetRequest(requestOptions);
      }

      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Retrieved the documents in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to retrieve the documents in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Groups documents in a collection. An aggregation can be optionally provided to group
   * a subset of documents in a collection or omitted to group all the documents
   * in a collection. A promise will be returned that will be resolved with the result
   * or rejected with an error.
   *
   * @param   {Aggregation}           aggregation                               Aggregation used to group documents.
   * @param   {Object}                [options]                                 Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the local cache.
   * @param   {ReadPolicy}            [options.readPolicy]                      Read policy to use for fetching
   *                                                                            the data.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * var aggregation = new Kinvey.Aggregation();
   * store.group(aggregation).then(function(result) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  group(aggregation, options = {}) {
    log.debug(`Grouping the documents in the ${this.name} collection.`, aggregation, options);

    options = assign({
      auth: this.auth,
      client: this.client,
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      readPolicy: this.readPolicy,
      handler() {}
    }, options);

    if (!(aggregation instanceof Aggregation)) {
      return Promise.reject(new KinveyError('Invalid aggregation. ' +
        'It must be an instance of the Kinvey.Aggregation class.'));
    }

    const promise = Promise.resolve().then(() => {
      let request;
      const requestOptions = {
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: `${this.getPathname(options.client)}/_group`,
        data: aggregation.toJSON(),
        timeout: options.timeout
      };

      switch (options.readPolicy) {
        case ReadPolicy.LocalOnly:
          request = new LocalRequest(requestOptions);
          break;
        case ReadPolicy.NetworkOnly:
          request = new NetworkRequest(requestOptions);
          break;
        case ReadPolicy.LocalFirst:
        default:
          request = new DeltaSetRequest(requestOptions);
      }

      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Grouped the documents in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to group the documents in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Counts documents in a collection. A query can be optionally provided to count
   * a subset of documents in a collection or omitted to count all the documents
   * in a collection. A promise will be returned that will be resolved with the count
   * or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to count a subset of documents.
   * @param   {Object}                [options]                                 Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the local cache.
   * @param   {ReadPolicy}            [options.readPolicy]                      Read policy to use for fetching
   *                                                                            the data.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'Kinvey');
   * store.count(query).then(function(count) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  count(query, options = {}) {
    log.debug(`Counting the number of documents in the ${this.name} collection.`, query);

    options = assign({
      auth: this.auth,
      client: this.client,
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      readPolicy: this.readPolicy,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      let request;
      const requestOptions = {
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: `${this.getPathname(options.client)}/_count`,
        query: query,
        timeout: options.timeout
      };

      switch (options.readPolicy) {
        case ReadPolicy.LocalOnly:
          request = new LocalRequest(requestOptions);
          break;
        case ReadPolicy.NetworkOnly:
          request = new NetworkRequest(requestOptions);
          break;
        case ReadPolicy.LocalFirst:
        default:
          request = new DeltaSetRequest(requestOptions);
      }

      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Counted the number of documents in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to count the number of documents in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Retrieves a single document in a collection by id. A promise will be returned that will
   * be resolved with the document or rejected with an error.
   *
   * @param   {string}                id                                        Document Id
   * @param   {Object}                [options]                                 Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the local cache.
   * @param   {ReadPolicy}            [options.readPolicy]                      Read policy to use for fetching
   *                                                                            the data.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.get('507f191e810c19729de860ea').then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  get(id, options = {}) {
    if (!id) {
      log.warn('No id was provided to retrieve a document.', id);
      return Promise.resolve(null);
    }

    log.debug(`Retrieving a document in the ${this.name} collection with id = ${id}.`);

    options = assign({
      auth: this.auth,
      client: this.client,
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      readPolicy: this.readPolicy,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      let request;
      const requestOptions = {
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: `${this.getPathname(options.client)}/${id}`,
        timeout: options.timeout
      };

      switch (options.readPolicy) {
        case ReadPolicy.LocalOnly:
          request = new LocalRequest(requestOptions);
          break;
        case ReadPolicy.NetworkOnly:
          request = new NetworkRequest(requestOptions);
          break;
        case ReadPolicy.LocalFirst:
        default:
          request = new DeltaSetRequest(requestOptions);
      }

      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return isArray(response.data) && response.data.length === 1 ? response.data[0] : response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Retrieved the document in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      log.error(`Failed to retrieve the document in the ${this.name} collection with id = ${id}.`, err);
    });

    return promise;
  }

  /**
   * Save a document or an array of documents to a collection. A promise will be returned that
   * will be resolved with the saved document/documents or rejected with an error.
   *
   * @param   {Object|Array}          doc                                       Document or documents to save.
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {WritePolicy}           [options.writePolicy]                     Write policy to use for saving
   *                                                                            the data.
   * @param   {boolean}               [options.skipSync=false]                  Set to true to prevent data from being
   *                                                                            adding to the sync table.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * var book = { name: 'How to Write a JavaScript Library', author: 'Kinvey' };
   * store.save(book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  save(doc, options = {}) {
    if (!doc) {
      log.warn('No doc was provided to be saved.', doc);
      return Promise.resolve(null);
    }

    if (doc._id) {
      log.warn('Doc argument contains an _id. Calling update instead.', doc);
      return this.update(doc, options);
    }

    log.debug(`Saving the document(s) to the ${this.name} collection.`, doc);

    options = assign({
      client: this.client,
      properties: null,
      auth: this.auth,
      timeout: undefined,
      writePolicy: this.writePolicy,
      skipSync: false,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      let request;
      const requestOptions = {
        method: HttpMethod.POST,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: this.getPathname(options.client),
        data: doc,
        timeout: options.timeout
      };

      switch (options.writePolicy) {
        case WritePolicy.NetworkOnly:
          request = new NetworkRequest(requestOptions);
          break;
        case WritePolicy.LocalOnly:
        case WritePolicy.LocalFirst:
        default:
          request = new LocalRequest(requestOptions);
      }

      return request.execute();
    }).then(response => {
      if (response && response.isSuccess()) {
        if (!options.skipSync
            && (options.writePolicy === WritePolicy.LocalOnly || options.writePolicy === WritePolicy.LocalFirst)) {
          return this._updateSync(response.data, options).then(() => {
            return response;
          });
        }
      }

      return response;
    }).then(response => {
      if (response && response.isSuccess()) {
        if (!options.skipSync && options.writePolicy === WritePolicy.LocalFirst) {
          return this.push(options).then(result => {
            let singular = false;
            let data = response.data;

            if (!isArray(data)) {
              singular = true;
              data = [data];
            }

            data = map(data, doc => {
              const syncResult = find(result.success, syncResult => {
                return syncResult._id === doc._id;
              });

              if (syncResult) {
                return syncResult.doc;
              }
            });

            if (singular) {
              response.data = data[0];
            } else {
              response.data = data;
            }

            return response;
          });
        }
      }

      return response;
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Saved the document(s) to the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to save the document(s) to the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Updates a document or an array of documents in a collection. A promise will be returned that
   * will be resolved with the updated document/documents or rejected with an error.
   *
   * @param   {Model|Array}           doc                                       Document or documents to update.
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth\]                           An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {WritePolicy}           [options.writePolicy]                     Write policy to use for saving
   *                                                                            the data.
   * @param   {boolean}               [options.skipSync=false]                  Set to true to prevent data from being
   *                                                                            adding to the sync table.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * var book = { _id: '507f191e810c19729de860ea', name: 'How to Write a JavaScript Library', author: 'Kinvey' };
   * store.update(book).then(function(book) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  update(doc, options = {}) {
    if (!doc) {
      log.warn('No doc was provided to be saved.', doc);
      return Promise.resolve(null);
    }

    if (!doc._id) {
      log.warn('Doc argument does not contain an _id. Calling save instead.', doc);
      return this.save(doc, options);
    }

    log.debug(`Updating the document(s) to the ${this.name} collection.`, doc);

    options = assign({
      client: this.client,
      properties: null,
      auth: this.auth,
      timeout: undefined,
      writePolicy: this.writePolicy,
      skipSync: false,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      let request;
      const requestOptions = {
        method: HttpMethod.PUT,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: `${this.getPathname(options.client)}/${doc._id}`,
        data: doc,
        timeout: options.timeout
      };

      switch (options.writePolicy) {
        case WritePolicy.NetworkOnly:
          request = new NetworkRequest(requestOptions);
          break;
        case WritePolicy.LocalOnly:
        case WritePolicy.LocalFirst:
        default:
          request = new LocalRequest(requestOptions);
      }

      return request.execute();
    }).then(response => {
      if (response && response.isSuccess()) {
        if (!options.skipSync
            && (options.writePolicy === WritePolicy.LocalOnly || options.writePolicy === WritePolicy.LocalFirst)) {
          return this._updateSync(response.data, options).then(() => {
            return response;
          });
        }
      }

      return response;
    }).then(response => {
      if (response && response.isSuccess()) {
        if (!options.skipSync && options.writePolicy === WritePolicy.LocalFirst) {
          return this.push(options).then(result => {
            let singular = false;
            let data = response.data;

            if (!isArray(data)) {
              singular = true;
              data = [data];
            }

            data = map(data, doc => {
              const syncResult = find(result.success, syncResult => {
                return syncResult._id === doc._id;
              });

              if (syncResult) {
                return syncResult.doc;
              }
            });

            if (singular) {
              response.data = data[0];
            } else {
              response.data = data;
            }

            return response;
          });
        }
      }

      return response;
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Updated the document(s) to the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to update the document(s) to the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Remove documents in a collection. A query can be optionally provided to remove
   * a subset of documents in a collection or omitted to remove all documents in a
   * collection. A promise will be returned that will be resolved with a count of the
   * number of documents removed or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {WritePolicy}           [options.writePolicy]                     Write policy to use for saving
   *                                                                            the data.
   * @param   {boolean}               [options.skipSync=false]                  Set to true to prevent data from being
   *                                                                            adding to the sync table.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * var query = new Kinvey.Query();
   * query.equalTo('author', 'Kinvey');
   * store.clear(query).then(function(count) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  clear(query, options = {}) {
    log.debug(`Clearing the models in the ${this.name} collection.`, query);

    options = assign({
      client: this.client,
      properties: null,
      auth: this.auth,
      timeout: undefined,
      writePolicy: this.writePolicy,
      skipSync: false,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      let request;
      const requestOptions = {
        method: HttpMethod.DELETE,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: this.getPathname(options.client),
        query: query,
        timeout: options.timeout
      };

      switch (options.writePolicy) {
        case WritePolicy.NetworkOnly:
          request = new NetworkRequest(requestOptions);
          break;
        case WritePolicy.LocalOnly:
        case WritePolicy.LocalFirst:
        default:
          request = new LocalRequest(requestOptions);
      }

      return request.execute();
    }).then(response => {
      if (response && response.isSuccess()) {
        if (!options.skipSync
            && (options.writePolicy === WritePolicy.LocalOnly || options.writePolicy === WritePolicy.LocalFirst)) {
          return this._updateSync(response.data.documents, options).then(() => {
            return response;
          });
        }
      }

      return response;
    }).then(response => {
      if (response && response.isSuccess()) {
        if (!options.skipSync && options.writePolicy === WritePolicy.LocalFirst) {
          return this.push(options).then(() => {
            return response;
          });
        }
      }

      return response;
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Cleared the models in the ${this.name} collection.`, response);
    }).catch(err => {
      log.error(`Failed to clear the models in the ${this.name} collection.`, err);
    });

    return promise;
  }

  /**
   * Remove a document in a collection. A promise will be returned that will be
   * resolved with a count of the number of documents removed or rejected with an error.
   *
   * @param   {string}                id                                        Document Id
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {WritePolicy}           [options.writePolicy]                     Write policy to use for saving
   *                                                                            the data.
   * @param   {boolean}               [options.skipSync=false]                  Set to true to prevent data from being
   *                                                                            adding to the sync table.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.remove('507f191e810c19729de860ea').then(function(count) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  remove(id, options = {}) {
    if (!id) {
      log.warn('No id was provided to be removed.', id);
      return Promise.resolve(null);
    }

    log.debug(`Removing a model in the ${this.name} collection with id = ${id}.`);

    options = assign({
      client: this.client,
      properties: null,
      auth: this.auth,
      timeout: undefined,
      writePolicy: this.writePolicy,
      skipSync: false,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      let request;
      const requestOptions = {
        method: HttpMethod.DELETE,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: `${this.getPathname(options.client)}/${id}`,
        timeout: options.timeout
      };

      switch (options.writePolicy) {
        case WritePolicy.NetworkOnly:
          request = new NetworkRequest(requestOptions);
          break;
        case WritePolicy.LocalOnly:
        case WritePolicy.LocalFirst:
        default:
          request = new LocalRequest(requestOptions);
      }

      return request.execute();
    }).then(response => {
      if (response && response.isSuccess()) {
        if (!options.skipSync
            && (options.writePolicy === WritePolicy.LocalOnly || options.writePolicy === WritePolicy.LocalFirst)) {
          return this._updateSync(response.data.documents, options).then(() => {
            return response;
          });
        }
      }

      return response;
    }).then(response => {
      if (response && response.isSuccess()) {
        if (!options.skipSync && options.writePolicy === WritePolicy.LocalFirst) {
          return this.push(options).then(() => {
            return response;
          });
        }
      }

      return response;
    }).then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });

    promise.then(response => {
      log.info(`Removed the model in the ${this.name} collection with id = ${id}.`, response);
    }).catch(err => {
      log.error(`Failed to remove the model in the ${this.name} collection with id = ${id}.`, err);
    });

    return promise;
  }

  /**
   * Push sync items for a collection to the network. A promise will be returned that will be
   * resolved with the result of the push or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to push a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.push().then(function(result) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  push(query, options = {}) {
    options = assign({
      client: this.client,
      properties: null,
      auth: this.auth,
      timeout: undefined,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: this._getSyncPathname(options.client),
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response && response.isSuccess()) {
        const localStore = Store.getInstance(this.name, StoreType.Local);
        const shouldSave = [];
        const shouldRemove = [];
        const docs = response.data.docs;
        const ids = Object.keys(docs);
        let size = response.data.size;

        const promises = map(ids, id => {
          const metadata = docs[id];
          const requestOptions = clone(metadata);
          return localStore.get(id, requestOptions).then(doc => {
            shouldSave.push(doc);
            return doc;
          }).catch(err => {
            if (err instanceof NotFoundError) {
              shouldRemove.push(id);
              return null;
            }

            throw err;
          });
        });

        return Promise.all(promises).then(() => {
          const networkStore = Store.getInstance(this.name, StoreType.Network);
          const saved = map(shouldSave, doc => {
            const metadata = docs[doc._id];
            const requestOptions = clone(metadata);
            requestOptions.skipSync = true;

            if (doc._id.indexOf(localIdPrefix) === 0) {
              const prevId = doc._id;
              doc._id = undefined;

              return networkStore.save(doc, requestOptions).then(doc => {
                return localStore.save(doc, requestOptions);
              }).then(doc => {
                return localStore.remove(prevId, requestOptions).then(result => {
                  if (result.count === 1) {
                    size = size - 1;
                    delete docs[prevId];
                    return {
                      _id: prevId,
                      doc: doc
                    };
                  }

                  return result;
                });
              }).catch(err => {
                doc._id = prevId;
                return {
                  _id: doc._id,
                  error: err
                };
              });
            }

            return networkStore.update(doc, requestOptions).then(doc => {
              size = size - 1;
              delete docs[doc._id];
              return {
                _id: doc._id,
                doc: doc
              };
            }).catch(err => {
              return {
                _id: doc._id,
                error: err
              };
            });
          });

          const removed = map(shouldRemove, id => {
            const metadata = docs[id];
            const requestOptions = clone(metadata);

            return networkStore.remove(id, requestOptions).then(result => {
              if (result.count === 1) {
                size = size - 1;
                delete docs[id];
                return {
                  _id: id
                };
              }

              return result;
            }).catch(err => {
              return {
                _id: id,
                error: err
              };
            });
          });

          return Promise.all([Promise.all(saved), Promise.all(removed)]);
        }).then(responses => {
          const savedResponses = responses[0];
          const removedResponses = responses[1];
          const result = {
            collection: this.name,
            success: [],
            error: []
          };

          forEach(savedResponses, savedResponse => {
            if (savedResponse.error) {
              result.error.push(savedResponse);
            } else {
              result.success.push(savedResponse);
            }
          });

          forEach(removedResponses, removedResponse => {
            if (removedResponse.error) {
              result.error.push(removedResponse);
            } else {
              result.success.push(removedResponse);
            }
          });

          return result;
        }).then(result => {
          const data = response.data;
          data.size = size;
          data.docs = docs;
          const request = new LocalRequest({
            method: HttpMethod.PUT,
            client: options.client,
            properties: options.properties,
            auth: options.auth,
            pathname: this._getSyncPathname(options.client),
            data: data,
            timeout: options.timeout
          });
          return request.execute().then(() => {
            return result;
          });
        });
      }

      return response;
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return {
          collection: this.name,
          success: [],
          error: []
        };
      }

      throw err;
    });

    return promise;
  }

  /**
   * Pull items for a collection from the network to your local cache. A promise will be
   * returned that will be resolved with the result of the pull or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to pull a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.pull().then(function(result) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  pull(query, options = {}) {
    const promise = this.syncCount(null, options).then(count => {
      if (count > 0) {
        throw new Error('Unable to pull data. You must push the pending sync items first.',
          'Call store.push() to push the pending sync items before you pull new data.');
      }

      options.readPolicy = ReadPolicy.NetworkOnly;
      return this.find(query, options);
    });

    return promise;
  }

  /**
   * Sync items for a collection. This will push pending sync items first and then
   * pull items from the network into your local cache. A promise will be
   * returned that will be resolved with the result of the pull or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to pull a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.sync().then(function(result) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  sync(query, options = {}) {
    const promise = this.push(null, options).then(pushResponse => {
      return this.pull(query, options).then(pullResponse => {
        return {
          push: pushResponse,
          sync: {
            collection: this.name,
            documents: pullResponse
          }
        };
      });
    });

    return promise;
  }

  /**
   * Count the number of sync items waiting to be pushed to the network. A promise will be
   * returned with the count of sync items or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to count a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the local cache.
   * @return  {Promise}                                                         Promise
   *
   * @example
   * var store = Kinvey.Store.getInstance('books');
   * store.syncCount().then(function(count) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  syncCount(query, options = {}) {
    options = assign({
      auth: this.auth,
      client: this.client,
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    if (query && !(query instanceof Query)) {
      return Promise.reject(new KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
    }

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: this._getSyncPathname(options.client),
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        return response.data.size || 0;
      }

      throw response.error;
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return 0;
      }

      throw err;
    });

    return promise;
  }

  /**
   * Add items to the be synced. A promise will be returned with null or rejected with an error.
   *
   * @param   {Object|Array}          docs                                      Document(s) to add to the sync table.
   * @param   {Object}                options                                   Options
   * @param   {Auth|Function|Object}  [options.auth]                            An auth function, custom function, or
   *                                                                            object that returns authorization info
   *                                                                            to authorize a request.
   * @param   {Client}                [options.client]                          Client to use.
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  _updateSync(docs, options = {}) {
    if (!this.name) {
      return Promise.reject(new KinveyError('Unable to add documents to the sync table for a store with no name.'));
    }

    if (!docs) {
      return Promise.resolve(null);
    }

    options = assign({
      auth: this.auth,
      client: this.client,
      properties: null,
      timeout: undefined,
      ttl: this.ttl,
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const request = new LocalRequest({
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: this._getSyncPathname(options.client),
        timeout: options.timeout
      });
      return request.execute();
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return new Response({
          statusCode: StatusCode.Ok,
          data: {
            _id: this.name,
            docs: {},
            size: 0
          }
        });
      }

      throw err;
    }).then(response => {
      if (response && response.isSuccess()) {
        const syncData = response.data || {
          _id: this.name,
          docs: {},
          size: 0
        };

        if (!isArray(docs)) {
          docs = [docs];
        }

        forEach(docs, doc => {
          if (doc._id) {
            if (!syncData.docs.hasOwnProperty(doc._id)) {
              syncData.size = syncData.size + 1;
            }

            syncData.docs[doc._id] = {
              lmt: doc._kmd ? doc._kmd.lmt : null
            };
          }
        });

        const request = new LocalRequest({
          method: HttpMethod.PUT,
          client: options.client,
          properties: options.properties,
          auth: options.auth,
          pathname: this._getSyncPathname(options.client),
          data: syncData,
          timeout: options.timeout
        });
        return request.execute();
      }

      return response;
    }).then(() => {
      return null;
    });

    return promise;
  }

  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       name                      Name of the collection.
   * @param  {StoreType}    [type=StoreType.Default]  Type of store to return.
   * @return {Store}                                  Store
   */
  static getInstance(name, type = StoreType.Default) {
    const store = new Store(name);

    switch (type) {
      case StoreType.Local:
        store.readPolicy = ReadPolicy.LocalOnly;
        store.writePolicy = WritePolicy.LocalOnly;
        break;
      case StoreType.Network:
        store.readPolicy = ReadPolicy.NetworkOnly;
        store.writePolicy = WritePolicy.NetworkOnly;
        break;
      case StoreType.Default:
      default:
        store.readPolicy = ReadPolicy.LocalFirst;
        store.writePolicy = WritePolicy.LocalFirst;
    }

    return store;
  }
}
