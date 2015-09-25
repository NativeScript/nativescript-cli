import clone from 'lodash/lang/clone';
import KinveyRack from 'kinvey-rack';
import SerializerMiddleware from './middleware/serializer';
import HttpMiddleware from './middleware/http';
import ParserMiddleware from './middleware/parser';
import StorageMiddleware from './middleware/storage';
const networkRackSymbol = Symbol();
const storageRackySymbol = Symbol();

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

  static get storageRack() {
    if (!Rack[storageRackySymbol]) {
      const rack = new Rack('Kinvey Storage Rack');
      rack.use(new StorageMiddleware);
      Rack[storageRackySymbol] = rack;
    }

    return Rack[storageRackySymbol];
  }

  static set storageRack(rack) {
    Rack[storageRackySymbol] = rack;
  }

  execute(request) {
    const requestClone = clone(request.toJSON(), true);
    return super.execute(requestClone).then((request) => {
      return request.response;
    });
  }
}

export default Rack;
