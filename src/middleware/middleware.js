import Rack from 'kinvey-rack';

class Middleware extends Rack.Middleware {
  constructor(name = 'Kinvey Middleware') {
    super(name);
  }
}

export default Middleware;
