import utils from './utils';
import KinveyRack from 'kinvey-rack';
import SerializerMiddleware from '../middleware/serializer';
import HttpMiddleware from '../middleware/http';
import ParserMiddleware from '../middleware/parser';
import CacheMiddleware from '../middleware/cache';
import DatabaseMiddleware from '../middleware/database';
const networkRack = Symbol();
const cacheRack = Symbol();
const databaseRack = Symbol();

class Rack extends KinveyRack {

  static get networkRack() {
    if (!utils.isDefined(this[networkRack])) {
      let rack = new Rack('Kinvey Network Rack');
      rack.use(new SerializerMiddleware());
      rack.use(new HttpMiddleware());
      rack.use(new ParserMiddleware());
      this[networkRack] = rack;
    }

    return this[networkRack];
  }

  static set networkRack(rack) {
    this[networkRack] = rack;
  }

  static get cacheRack() {
    if (!utils.isDefined(this[cacheRack])) {
      let rack = new Rack('Kinvey Cache Rack');
      rack.use(new CacheMiddleware());
      this[cacheRack] = rack;
    }

    return this[cacheRack];
  }

  static set cacheRack(rack) {
    this[cacheRack] = rack;
  }

  static get databaseRack() {
    if (!utils.isDefined(this[databaseRack])) {
      let rack = new Rack('Kinvey Database Rack');
      rack.use(new DatabaseMiddleware());
      this[databaseRack] = rack;
    }

    return this[databaseRack];
  }

  static set databaseRack(rack) {
    this[databaseRack] = rack;
  }

  execute(request) {
    return super.execute(utils.clone(request)).then((result) => {
      return result.response;
    });
  }
}

export default Rack;
