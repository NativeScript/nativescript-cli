import clone from 'lodash/lang/clone';
import KinveyRack from 'kinvey-rack';
import SerializerMiddleware from './middleware/serializer';
import HttpMiddleware from './middleware/http';
import ParserMiddleware from './middleware/parser';
import DatabaseMiddleware from './middleware/database';
const networkRackSymbol = Symbol();
const databaseRackSymbol = Symbol();

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

  static get databaseRack() {
    if (!Rack[databaseRackSymbol]) {
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
    return super.execute(clone(request.toJSON(), true)).then((request) => {
      return request.response;
    });
  }
}

export default Rack;
