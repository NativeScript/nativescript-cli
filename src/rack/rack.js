const clone = require('lodash/lang/clone');
const Response = require('../core/response');
const KinveyRack = require('kinvey-rack');
const Serializer = require('./middleware/serializer');
const Http = require('./middleware/http');
const Parser = require('./middleware/parser');
const Cache = require('./middleware/cache');
const Promise = require('bluebird');
const result = require('lodash/object/result');
const networkRackSymbol = Symbol();
const cacheRackSymbol = Symbol();

class Rack extends KinveyRack {
  static get networkRack() {
    if (!Rack[networkRackSymbol]) {
      const rack = new Rack('Kinvey Network Rack');
      rack.use(new Serializer());
      rack.use(new Http());
      rack.use(new Parser());
      Rack[networkRackSymbol] = rack;
    }

    return Rack[networkRackSymbol];
  }

  static set networkRack(rack) {
    Rack[networkRackSymbol] = rack;
  }

  static get cacheRack() {
    if (!Rack[cacheRackSymbol]) {
      const rack = new Rack('Kinvey Cache Rack');
      rack.use(new Cache());
      Rack[cacheRackSymbol] = rack;
    }

    return Rack[cacheRackSymbol];
  }

  static set cacheRack(rack) {
    Rack[cacheRackSymbol] = rack;
  }

  execute(request) {
    const requestClone = clone(result(request, 'toJSON', request), true);
    const promise = super.execute(requestClone).then((request) => {
      const response = request.response;

      if (response) {
        return new Response(response.statusCode, response.headers, response.data);
      }

      return response;
    });
    return Promise.resolve(promise);
  }
}

module.exports = Rack;
