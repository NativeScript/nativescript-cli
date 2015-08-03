import Rack from 'kinvey-rack';
import UrlPattern from 'url-pattern';
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
        let pattern = new UrlPattern('/:namespace/:appKey/:collection/:id');
        let matches = pattern.match(request.path);

        if (!matches) {
          pattern = new UrlPattern('/:namespace/:appKey/:collection');
          matches = pattern.match(request.path);
        }

        return resolve(matches);
      }

      reject(); // TODO: Give reason
    });
  }
}

export default Middleware;
