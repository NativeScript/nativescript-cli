const Promise = require('bluebird');
const Collection = require('./collections/collection');
const Query = require('./query');
const SyncUtils = require('./utils/sync');
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'kinvey.sync';

class Sync {
  static isEnabled() {
    return SyncUtils.isEnabled();
  }

  static enable() {
    SyncUtils.enable();
  }

  static disable() {
    SyncUtils.disable();
  }

  static push(options) {
    const syncCollection = new Collection(syncCollectionName, options);
    const query = new Query();
    query.greaterThan('size', 0);
    const promise = syncCollection.find(query, options).then(rows => {
      const promises = rows.map(row => {
        const collection = new Collection(row.name, options);
        return collection.push();
      });

      return Promise.all(promises);
    });

    return promise;
  }

  static sync(options) {
    const syncCollection = new Collection(syncCollectionName, options);
    const promise = syncCollection.find(null, options).then(rows => {
      const promises = rows.map(row => {
        const collection = new Collection(row.name, options);
        return collection.sync();
      });

      return Promise.all(promises);
    });

    return promise;
  }
}

module.exports = Sync;
