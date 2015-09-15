import clone from 'lodash/lang/clone';
import KinveyRack from 'kinvey-rack';
import SerializerMiddleware from '../middleware/serializer';
import HttpMiddleware from '../middleware/http';
import ParserMiddleware from '../middleware/parser';
import CacheMiddleware from '../middleware/cache';
import DatabaseMiddleware from '../middleware/database';
import isDefined from '../utils/isDefined';
const networkRackSymbol = Symbol();
const cacheRackSymbol = Symbol();
const databaseRackSymbol = Symbol();

class Rack extends KinveyRack {

  static get networkRack() {
    if (!isDefined(Rack[networkRackSymbol])) {
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
    if (!isDefined(Rack[cacheRackSymbol])) {
      const rack = new Rack('Kinvey Cache Rack');
      rack.use(new CacheMiddleware());
      Rack[cacheRackSymbol] = rack;
    }

    return Rack[cacheRackSymbol];
  }

  static set cacheRack(rack) {
    Rack[cacheRackSymbol] = rack;
  }

  static get databaseRack() {
    if (!isDefined(Rack[databaseRackSymbol])) {
      const rack = new Rack('Kinvey Database Rack');
      rack.use(new DatabaseMiddleware());
      Rack[databaseRackSymbol] = rack;
    }

    return Rack[databaseRackSymbol];
  }

  static set databaseRack(rack) {
    Rack[databaseRackSymbol] = rack;
  }

  execute(request) {
    return super.execute(clone(request)).then((result) => {
      return result.response;
    });
  }
}

export default Rack;
