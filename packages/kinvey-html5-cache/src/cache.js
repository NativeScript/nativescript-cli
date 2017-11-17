const { CacheMiddleware } = require('kinvey-request');
const { Storage } = require('./storage');

exports.CacheMiddleware = class Html5CacheMiddleware extends CacheMiddleware {
  loadStorage(name) {
    return new Storage(name);
  }
}
