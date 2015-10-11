import clone from 'lodash/lang/clone';
import Response from '../core/response';
import KinveyRack from 'kinvey-rack';
import SerializerMiddleware from './middleware/serializer';
import HttpMiddleware from './middleware/http';
import ParserMiddleware from './middleware/parser';
import CacheMiddleware from './middleware/cache';
const networkRackSymbol = Symbol();
const cacheRackSymbol = Symbol();

class Rack extends KinveyRack {

  static get networkRack() {
    if (!Rack[networkRackSymbol]) {
      const rack = new Rack('Kinvey Network Rack');
      rack.use(new SerializerMiddleware());
      rack.use(new HttpMiddleware());
      rack.use(new ParserMiddleware());
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
      rack.use(new CacheMiddleware());
      Rack[cacheRackSymbol] = rack;
    }

    return Rack[cacheRackSymbol];
  }

  static set cacheRack(rack) {
    Rack[cacheRackSymbol] = rack;
  }

  execute(request) {
    const requestClone = clone(result(request, 'toJSON', request), true);
    return super.execute(requestClone).then((request) => {
      const response = request.response;

      if (response) {
        return new Response(response.statusCode, response.headers, response.data);
      }

      return response;
    });
  }
}

export default Rack;
