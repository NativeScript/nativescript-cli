import clone from 'clone';
import KinveyRack from 'kinvey-rack';
import SerializerMiddleware from '../middleware/serializer';
import HttpMiddleware from '../middleware/http';
import ParserMiddleware from '../middleware/parser';
import CacheMiddleware from '../middleware/cache';
import DatabaseMiddleware from '../middleware/database';
import {isDefined} from './utils';
const NETWORK_RACK_SYMBOL = Symbol();
const CACHE_RACK_SYMBOL = Symbol();
const DATABASE_RACK_SYMBOL = Symbol();

class Rack extends KinveyRack {

  static get networkRack() {
    if (!isDefined(Rack[NETWORK_RACK_SYMBOL])) {
      let rack = new Rack('Kinvey Network Rack');
      rack.use(new SerializerMiddleware());
      rack.use(new HttpMiddleware());
      rack.use(new ParserMiddleware());
      Rack[NETWORK_RACK_SYMBOL] = rack;
    }

    return Rack[NETWORK_RACK_SYMBOL];
  }

  static set networkRack(rack) {
    Rack[NETWORK_RACK_SYMBOL] = rack;
  }

  static get cacheRack() {
    if (!isDefined(Rack[CACHE_RACK_SYMBOL])) {
      let rack = new Rack('Kinvey Cache Rack');
      rack.use(new CacheMiddleware());
      Rack[CACHE_RACK_SYMBOL] = rack;
    }

    return Rack[CACHE_RACK_SYMBOL];
  }

  static set cacheRack(rack) {
    Rack[CACHE_RACK_SYMBOL] = rack;
  }

  static get databaseRack() {
    if (!isDefined(Rack[DATABASE_RACK_SYMBOL])) {
      let rack = new Rack('Kinvey Database Rack');
      rack.use(new DatabaseMiddleware());
      Rack[DATABASE_RACK_SYMBOL] = rack;
    }

    return Rack[DATABASE_RACK_SYMBOL];
  }

  static set databaseRack(rack) {
    Rack[DATABASE_RACK_SYMBOL] = rack;
  }

  execute(request) {
    return super.execute(clone(request)).then((result) => {
      return result.response;
    });
  }
}

export default Rack;
