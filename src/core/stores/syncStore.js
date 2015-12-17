const LocalStore = require('./localStore');
const NetworkStore = require('./networkStore');
const DataPolicy = require('../enums').DataPolicy;
const WritePolicy = require('../enums').WritePolicy;
const HttpMethod = require('../enums').HttpMethod;
const StatusCode = require('../enums').StatusCode;
const Request = require('../request').Request;
const NotFoundError = require('../errors').NotFoundError;
const Response = require('../response');
const Query = require('../query');
const UrlPattern = require('url-pattern');
const Promise = require('bluebird');
const assign = require('lodash/object/assign');
const clone = require('lodash/lang/clone');
const forEach = require('lodash/collection/forEach');
const map = require('lodash/collection/map');
const isArray = require('lodash/lang/isArray');
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';

class SyncStore extends LocalStore {
  constructor(name, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.LocalOnly
    }, options);
    super(name, options);
  }

  create(model, options = {}) {
    const promise = super.create(model, options).then(model => {
      return this.notifySync(model).then(() => {
        return model;
      });
    });

    return promise;
  }

  update(model, options = {}) {
    const promise = super.update(model, options).then(model => {
      return this.notifySync(model).then(() => {
        return model;
      });
    });

    return promise;
  }

  clear(query, options = {}) {
    const promise = super.clear(query, options).then(result => {
      const promises = map(result.documents, document => {
        return this.notifySync(document);
      });
      return Promise.all(promises).then(() => {
        return result;
      });
    });

    return promise;
  }

  delete(id, options = {}) {
    const promise = super.delete(id, options).then(result => {
      const promises = map(result.documents, document => {
        return this.notifySync(document);
      });
      return Promise.all(promises).then(() => {
        return result;
      });
    });

    return promise;
  }

  notifySync(data = [], options = {}) {
    options = assign({
      client: this.client
    }, options);

    const pattern = new UrlPattern('/:namespace/:appId/:collection(/)(:id)(/)');
    const matches = pattern.match(this.getPathname(options.client));
    const getRequest = new Request({
      method: HttpMethod.GET,
      pathname: `/${matches.namespace}/${matches.appId}/${syncCollectionName}/${matches.collection}`,
      auth: this.auth,
      client: this.client,
      dataPolicy: DataPolicy.LocalOnly
    });

    const promise = getRequest.execute().catch(() => {
      return new Response(StatusCode.OK, {}, {
        _id: matches.collection,
        documents: {},
        size: 0
      });
    }).then(response => {
      const syncCollection = response.data || {
        _id: matches.collection,
        documents: {},
        size: 0
      };
      const documents = syncCollection.documents;
      let size = syncCollection.size;

      if (!isArray(data)) {
        data = [data];
      }

      forEach(data, item => {
        if (item._id) {
          if (!documents.hasOwnProperty(item._id)) {
            size = size + 1;
          }

          documents[item._id] = {
            lmt: item._kmd ? item._kmd.lmt : null
          };
        }
      });

      syncCollection.documents = documents;
      syncCollection.size = size;

      const updateRequest = new Request({
        method: HttpMethod.PUT,
        pathname: `/${matches.namespace}/${matches.appId}/${syncCollectionName}/${matches.collection}`,
        auth: this.auth,
        data: syncCollection,
        client: this.client,
        writePolicy: WritePolicy.Local
      });
      return updateRequest.execute();
    }).then(() => {
      return null;
    });

    return promise;
  }

  syncCount(options = {}) {
    options = assign({
      auth: this.auth,
      client: this.client
    }, options);
    options.dataPolicy = DataPolicy.LocalOnly;

    const store = new SyncStore(syncCollectionName, options);
    const promise = store.get(this.name, options).then(model => {
      return model.get('size') || 0;
    });
    return promise;
  }

  push(options = {}) {
    options = assign({
      auth: this.auth,
      client: this.client
    }, options);
    options.dataPolicy = DataPolicy.LocalOnly;

    // Get the documents to sync
    const syncCollectionLocalStore = new LocalStore(syncCollectionName, options);
    const promise = syncCollectionLocalStore.get(this.name, options).then(syncModel => {
      const collectionLocalStore = new LocalStore(syncModel.id, options);
      const documents = syncModel.get('documents');
      const identifiers = Object.keys(documents);
      let size = syncModel.get('size');

      // Get the document. If it is found, push it onto the saved array and if
      // it is not (aka a NotFoundError is thrown) then push the id onto the destroyed
      // array.
      const saved = [];
      const deleted = [];
      const promises = map(identifiers, id => {
        const metadata = documents[id];
        const requestOptions = clone(assign(metadata, options));
        requestOptions.dataPolicy = DataPolicy.LocalOnly;
        return collectionLocalStore.get(id, requestOptions).then(model => {
          saved.push(model);
          return model;
        }).catch(() => {
          deleted.push(id);
          return null;
        });
      });

      // Save and delete everything that needs to be synced
      return Promise.all(promises).then(() => {
        const networkStore = new NetworkStore(this.name, options);

        // Save the models that need to be saved
        const savePromises = map(saved, model => {
          const metadata = documents[model.id];
          const requestOptions = clone(assign(metadata, options));

          // If the model is new then just save it
          if (model.isNew()) {
            const originalId = model.id;
            model.id = undefined;
            return networkStore.create(model, requestOptions).then(model => {
              // Remove the locally created model
              return collectionLocalStore.delete(originalId, requestOptions).then(() => {
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
          return networkStore.update(model, requestOptions).then(model => {
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
        const deletePromises = map(deleted, id => {
          const metadata = documents[id];
          const requestOptions = clone(assign(metadata, options));
          return networkStore.delete(id, requestOptions).then(response => {
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
        return syncCollectionLocalStore.create(syncModel, options).then(() => {
          return result;
        });
      });
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

  pull(query, options = {}) {
    options = assign({
      auth: this.auth,
      client: this.client
    }, options);

    const promise = this.syncCount(options).then(count => {
      if (count > 0) {
        throw new KinveyError('Unable to pull data. You must push the pending items to sync first.', 'Call store.push() to push the pending items to sync before you pull new data.');
      }

      options.dataPolicy = DataPolicy.NetworkOnly;
      return this.find(query, options);
    })
  }

  sync(query, options = {}) {
    options = assign({
      auth: this.auth,
      client: this.client
    }, options);

    const promise = this.push(options).then(pushResponse => {
      options.dataPolicy = DataPolicy.NetworkOnly;
      return this.find(query, options).then(syncResponse => {
        return {
          push: pushResponse,
          sync: {
            collection: this.name,
            documents: syncResponse
          }
        };
      });
    });

    return promise;
  }

  clearSync(options = {}) {
    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client
    }, options);

    const syncStore = new LocalStore(syncCollectionName, options);
    const query = new Query();
    query.contains('_id', [this.name]);
    const promise = syncStore.clear(query, options);
    return promise;
  }
}

module.exports = SyncStore;
