const Request = require('../core/request').Request;
const NotFoundError = require('../core/errors').NotFoundError;
const HttpMethod = require('../core/enums').HttpMethod;
const Client = require('../core/client');
const assign = require('lodash/object/assign');
const forEach = require('lodash/collection/forEach');
const isArray = require('lodash/lang/isArray');
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'kinvey.sync';
let enabled = false;

class SyncUtils {
  static isEnabled() {
    return enabled;
  }

  static enable() {
    enabled = true;
  }

  static disable() {
    enabled = false;
  }

  getPath(client = Client.sharedInstance()) {
    return `/${appdataNamespace}/${client.appId}/${syncCollectionName}`;
  }

  notify(collectionName, documents = [], options = {}) {
    if (!isArray(documents)) {
      documents = [documents];
    }

    options = assign({
      client: Client.sharedInstance()
    }, options);
    options.method = HttpMethod.GET;
    options.path = `${this.getPath(options.client)}/${collectionName}`;

    const getRequest = new Request(options);
    const promise = getRequest.execute().then(response => {
      return response.data;
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return { // eslint-disable-line new-cap
          _id: collectionName,
          documents: {},
          size: 0
        };
      }

      throw err;
    }).then(syncCollection => {
      forEach(documents, doc => {
        if (!syncCollection.documents.hasOwnProperty(doc._id)) {
          syncCollection.size += 1;
        }

        const timestamp = doc._kmd ? doc._kmd.lmt : null;

        syncCollection.documents[doc.id] = {
          timestamp: timestamp
        };
      });

      options.method = HttpMethod.PUT;
      const saveRequest = new Request(options);
      return saveRequest.execute();
    }).then(() => {
      return null;
    });

    return promise;
  }
}

module.exports = SyncUtils;
