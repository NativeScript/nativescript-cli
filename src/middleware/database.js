import Middleware from './middleware';
<<<<<<< Updated upstream
// import HttpMethod from '../enums/httpMethod';
// import Database from '../core/database';
// import log from '../core/logger';
// import utils from '../core/utils';
=======

// import HttpMethod from '../enums/httpMethod';
// import Database from '../core/database';
// import log from '../core/logger';
// import utils from '../utils';
>>>>>>> Stashed changes
// import Response from '../core/response';

class DatabaseMiddleware extends Middleware {
  constructor() {
    super('Kinvey Database Middleware');
  }

  handle(request) {
    return Promise.resolve(request);
  }
}

export default DatabaseMiddleware;
