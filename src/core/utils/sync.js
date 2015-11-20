const Request = require('../request').Request;
const NotFoundError = require('../errors').NotFoundError;
const HttpMethod = require('../enums').HttpMethod;
const DataPolicy = require('../enums').DataPolicy;
const UrlPattern = require('url-pattern');
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

  notify(request, response) {
    const pattern = new UrlPattern('/:namespace/:appId/:collection(/)(:id)(/)');
    const matches = pattern.match(request.path);
    const path = `/${appdataNamespace}/${request.client.appId}/${syncCollectionName}/${matches.collection}`;
    const getRequest = new Request({
      method: HttpMethod.GET,
      path: path,
      dataPolicy: DataPolicy.LocalOnly
    });

    // {
    //   _id = 'books',
    //   documents = {
    //     '1231uhds089kjhsd0923': {
    //       operation: 'POST',
    //       requestProperties: ...
    //     }
    //   },
    //   size: 1
    // }

    const promise = getRequest.execute().then(response => {
      return response.data;
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return {
          _id: matches.collection,
          documents: {},
          size: 0
        };
      }

      throw err;
    }).then(syncCollection => {
      let data = response.data;

      if (!isArray(data)) {
        data = [data];
      }

      forEach(data, item => {
        if (item._id) {
          if (!syncCollection.documents.hasOwnProperty(item._id)) {
            syncCollection.size += 1;
          }

          const timestamp = item._kmd ? item._kmd.lmt : null;

          syncCollection.documents[item._id] = {
            request: request,
            timestamp: timestamp
          };
        }
      });

      const saveRequest = new Request({
        method: HttpMethod.PUT,
        path: path,
        dataPolicy: DataPolicy.LocalOnly
      });
      return saveRequest.execute();
    }).then(() => {
      return null;
    });

    return promise;
  }
}

module.exports = SyncUtils;
