const Rack = require('kinvey-rack');
const UrlPattern = require('url-pattern');
const Promise = require('bluebird');
const urlPartsSymbol = Symbol();

class Middleware extends Rack.Middleware {
  get protocol() {
    return this[urlPartsSymbol].protocol;
  }

  constructor(name = 'Kinvey Middleware') {
    super(name);
  }

  handle(request) {
    return new Promise((resolve, reject) => {
      if (request) {
        const pattern = new UrlPattern('/:namespace/:appId/:collection(/)(:id)(/)');
        const matches = pattern.match(request.path);
        return resolve(matches);
      }

      reject(); // TODO: Give reason
    });
  }
}

module.exports = Middleware;
