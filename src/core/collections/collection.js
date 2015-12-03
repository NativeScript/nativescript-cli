const Aggregation = require('../aggregation');
const Promise = require('bluebird');
const Request = require('../request').Request;
const HttpMethod = require('../enums').HttpMethod;
const DataPolicy = require('../enums').DataPolicy;
const NotFoundError = require('../errors').NotFoundError;
const Client = require('../client');
const Query = require('../query');
const Auth = require('../auth');
const Model = require('../models/model');
const assign = require('lodash/object/assign');
const result = require('lodash/object/result');
const forEach = require('lodash/collection/forEach');
const log = require('loglevel');
const clone = require('lodash/lang/clone');
const isArray = require('lodash/lang/isArray');
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';

// const syncBatchSize = process.env.KINVEY_SYCN_BATCH_SIZE || 1000;

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
   * @param {string}      name                                        Name of the collection.
   * @param {Object}      [options]                                   Options.
   * @param {Client}      [options.client=Client.sharedInstance()]    Client to use.
   * @param {DataPolicy}  [options.dataPolicy=DataPolicy.LocalFirst]  Data policy to use.
   * @param {Model}       [options.model=Model]                       Model class to use.
   */
  constructor(name, options = {}) {
    options = assign({
      auth: Auth.default,
      client: Client.sharedInstance(),
      dataPolicy: DataPolicy.LocalFirst,
      model: Model,
      skipSync: false
    }, options);

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
     * @type {DataPolicy}
     */
    this.dataPolicy = options.dataPolicy;

    /**
     * @type {Model}
     */
    this.model = options.model;

    /**
     * @type {boolean}
     */
    this.skipSync = options.skipSync;
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
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.GET;
    options.pathname = this.getPathname(options.client);
    options.query = query;

    const request = new Request(options);
    const promise = request.execute().then(response => {
      let data = response.data;
      const models = [];

      if (data) {
        if (!isArray(data)) {
          data = [data];
        }

        forEach(data, obj => {
          if (obj) {
            models.push(new this.model(obj, options)); // eslint-disable-line new-cap
          }
        });
      }

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

    if (!(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(result(aggregation, 'toJSON', aggregation));
    }

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.GET;
    options.pathname = `${this.getPathname(options.client)}/_group`;
    options.data = aggregation.toJSON();

    const request = new Request(options);
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

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.GET;
    options.pathname = `${this.getPathname(options.client)}/_count`;
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
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.GET;
    options.pathname = `${this.getPathname(options.client)}/${id}`;

    const request = new Request(options);
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
   * @param   {Model}        model                                        Model
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.NetworkFirst]   Data policy
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

    if (!model) {
      log.warn('No model was provided to be saved.', model);
      Promise.resolve(null);
    }

    if (model && !(model instanceof this.model)) {
      model = new this.model(result(model, 'toJSON', model), options); // eslint-disable-line new-cap
    }

    if (model.id && model.isNew()) {
      if (model.isNew()) {
        model.unset('_id');
      } else {
        log.warn('The model is not new. Updating the model.', model);
        return this.update(model, options);
      }
    }

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.POST;
    options.pathname = this.getPathname(options.client);
    options.data = model.toJSON();

    const request = new Request(options);
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
   * @param   {Object}       model                                        Model
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.NetworkFirst]   Data policy
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

    if (!model) {
      log.warn('No model was provided to be updated.', model);
      Promise.resolve(null);
    }

    if (!(model instanceof this.model)) {
      model = new this.model(result(model, 'toJSON', model), options); // eslint-disable-line new-cap
    }

    if (model.id) {
      if (model.isNew()) {
        log.warn('The model is new. Saving the model.', model);
        return this.save(model, options);
      }
    }

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.PUT;
    options.pathname = `${this.getPathname(options.client)}/${model.id}`;
    options.data = model.toJSON();

    const request = new Request(options);
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
   * collection.clear(query).then(function(response) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  clear(query, options = {}) {
    log.debug(`Deleting the models in the ${this.name} collection by query.`, query);

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.DELETE;
    options.pathname = this.getPathname(options.client);
    options.query = query;

    const request = new Request(options);
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
   * @param   {string}       id                                           Document Id
   * @param   {Object}       options                                      Options
   * @param   {DataPolicy}   [options.dataPolicy=DataPolicy.NetworkFirst]   Data policy
   * @param   {AuthType}     [options.authType=AuthType.Default]          Auth type
   * @return  {Promise}                                                   Promise
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
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync,
      silent: false
    }, options);
    options.method = HttpMethod.DELETE;
    options.pathname = `${this.getPathname(options.client)}/${id}`;

    const request = new Request(options);
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

  countSync(options = {}) {
    options = assign({
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.dataPolicy = DataPolicy.LocalOnly;

    const syncCollection = new Collection(syncCollectionName, options);
    const promise = syncCollection.get(this.name, options).then(row => {
      return row.get('size') || 0;
    });

    return promise;
  }

  push(options = {}) {
    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.dataPolicy = DataPolicy.LocalOnly;

    // Get the documents to sync
    const syncCollection = new Collection(syncCollectionName, options);
    const promise = syncCollection.get(this.name, options).then(syncModel => {
      const documents = syncModel.get('documents');
      const identifiers = Object.keys(documents);
      let size = syncModel.get('size');

      // Get the document. If it is found, push it onto the saved array and if
      // it is not (aka a NotFoundError is thrown) then push the id onto the destroyed
      // array.
      const saved = [];
      const deleted = [];
      const promises = identifiers.map(id => {
        const metadata = documents[id];
        const requestOptions = clone(assign(metadata, options));
        requestOptions.dataPolicy = DataPolicy.LocalOnly;
        return this.get(id, requestOptions).then(model => {
          saved.push(model);
          return model;
        }).catch(() => {
          deleted.push(id);
          return null;
        });
      });

      // Save and delete everything that needs to be synced
      return Promise.all(promises).then(() => {
        // Save the models that need to be saved
        const savePromises = saved.map(model => {
          const metadata = documents[model.id];
          const requestOptions = clone(assign(metadata, options));
          requestOptions.dataPolicy = DataPolicy.NetworkFirst;

          // If the model is new then just save it
          if (model.isNew()) {
            const originalId = model.id;
            model.unset('_id');
            return this.save(model, requestOptions).then(model => {
              // Remove the locally created model
              requestOptions.dataPolicy = DataPolicy.LocalOnly;
              requestOptions.skipSync = true;
              return this.delete(originalId, requestOptions).then(() => {
                size = size - 1;
                delete documents[originalId];

                return {
                  _id: model.id,
                  model: model
                };
              });
            }).catch(err => {
              model.set('_id', originalId);
              return {
                _id: model.id,
                error: err
              };
            });
          }

          // Else just update the model
          return this.update(model, requestOptions).then(model => {
            size = size - 1;
            delete documents[model.id];

            return {
              _id: model.id,
              model: model
            };
          }).catch(err => {
            return {
              _id: model.id,
              error: err
            };
          });
        });

        // Delete the models that need to be deleted
        const deletePromises = deleted.map(id => {
          const metadata = documents[id];
          const requestOptions = clone(assign(metadata, options));
          requestOptions.dataPolicy = DataPolicy.NetworkFirst;
          return this.delete(id, requestOptions).then(response => {
            size = size - 1;
            delete documents[id];

            return {
              _id: id,
              model: response.documents[0]
            };
          }).catch(err => {
            return {
              _id: id,
              error: err
            };
          });
        });

        return Promise.all([Promise.all(savePromises), Promise.all(deletePromises)]);
      }).then(responses => {
        const saveResponses = responses[0];
        const deletedResponses = responses[1];

        const result = {
          collection: syncModel.id,
          success: [],
          error: []
        };

        forEach(saveResponses, saveResponse => {
          if (saveResponse.error) {
            result.error.push(saveResponse);
          } else {
            result.success.push(saveResponse);
          }
        });

        forEach(deletedResponses, deleteResponse => {
          if (deleteResponse.error) {
            result.error.push(deleteResponse);
          } else {
            result.success.push(deleteResponse);
          }
        });

        return result;
      }).then(result => {
        syncModel.set('size', size);
        syncModel.set('documents', documents);
        options.skipSync = true;
        return syncCollection.save(syncModel, options).then(() => {
          return result;
        });
      });
    });

    return promise;
  }

  sync(query, options = {}) {
    options = assign({
      dataPolicy: this.dataPolicy,
      auth: Auth.default,
      client: this.client,
      skipSync: this.skipSync
    }, options);

    const promise = this.push(options).then(pushResponse => {
      options.dataPolicy = DataPolicy.NetworkOnly;
      return this.find(query, options).then(models => {
        options.dataPolicy = DataPolicy.LocalOnly;
        options.skipSync = true;
        return this.save(models, options);
      }).then(syncResponse => {
        return {
          push: pushResponse,
          sync: {
            collection: this.name,
            models: syncResponse
          }
        };
      });
    });

    return promise;
  }

  clearSync(options = {}) {
    options = assign({
      dataPolicy: this.dataPolicy,
      auth: Auth.default,
      client: this.client
    }, options);
    options.skipSync = true;

    const syncCollection = new Collection(syncCollectionName, options);
    const query = new Query();
    query.contains('_id', [this.name]);
    const promise = syncCollection.clear(query, options);
    return promise;
  }
}

module.exports = Collection;
