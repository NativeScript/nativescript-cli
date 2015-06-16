import utils from './utils';
import KinveyRack from 'kinvey-rack';
import SerializerMiddleware from '../middleware/serializer';
import HttpMiddleware from '../middleware/http';
import ParserMiddleware from '../middleware/parser';
import CacheMiddleware from '../middleware/cache';
const networkRack = Symbol();
const cacheRack = Symbol();

class Rack extends KinveyRack {

  static networkRack() {
    if (!utils.isDefined(this[networkRack])) {
      let rack = new Rack('Kinvey Network Rack');
      rack.use(new SerializerMiddleware());
      rack.use(new HttpMiddleware());
      rack.use(new ParserMiddleware());
      this[networkRack] = rack;
    }
    return this[networkRack];
  }

  static cacheRack() {
    if (!utils.isDefined(this[cacheRack])) {
      let rack = new Rack('Kinvey Cache Rack');
      rack.use(new SerializerMiddleware());
      rack.use(new CacheMiddleware());
      rack.use(new ParserMiddleware());
      this[cacheRack] = rack;
    }
    return this[cacheRack];
  }

  execute(request) {
    return super.execute(utils.clone(request)).then((result) => {
      return result.response;
    });
  }
}

export default Rack;
