const Files = require('../core/collections/files');
const transformOptions = require('./utils').transformOptions;
const wrapCallbacks = require('./utils').wrapCallbacks;
const forEach = require('lodash/collection/forEach');

class LegacyFile {
  static find(query, options) {
    const collection = new Files(transformOptions(options));
    const promise = collection.find(query, transformOptions(options)).then(models => {
      const documents = [];

      forEach(models, model => {
        documents.push(model.toJSON());
      });

      return documents;
    });

    return promise;
  }

  static upload(file, data, options) {
    if (arguments.length === 2) {
      options = data;
    }

    const collection = new Files(transformOptions(options));
    const promise = collection.upload(file, data, transformOptions(options)).then(file => {
      return file.toJSON();
    });
    return promise;
  }

  static destroy(name, options) {
    const collection = new Files(transformOptions(options));
    const promise = collection.delete(name, transformOptions(options));
    return wrapCallbacks(promise, options);
  }
}

module.exports = LegacyFile;
