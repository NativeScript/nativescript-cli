const Files = require('../core/stores/files');
const mapLegacyOptions = require('./utils').mapLegacyOptions;
const wrapCallbacks = require('./utils').wrapCallbacks;
const forEach = require('lodash/forEach');

class LegacyFile {
  static find(query, options) {
    options = mapLegacyOptions(options);

    const collection = new Files(options);
    const promise = collection.find(query, options).then(models => {
      const documents = [];

      forEach(models, model => {
        documents.push(model.toJSON());
      });

      return documents;
    });
    return wrapCallbacks(promise, options);
  }

  static download(name, options) {
    options = mapLegacyOptions(options);

    const collection = new Files(options);
    const promise = collection.download(name, options).then(file => {
      return file.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static upload(file, data, options) {
    options = mapLegacyOptions(options);

    if (arguments.length === 2) {
      options = data;
    }

    const collection = new Files(options);
    const promise = collection.upload(file, data, options).then(file => {
      return file.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static destroy(name, options) {
    options = mapLegacyOptions(options);

    const collection = new Files(options);
    const promise = collection.delete(name, options);
    return wrapCallbacks(promise, options);
  }
}

module.exports = LegacyFile;
