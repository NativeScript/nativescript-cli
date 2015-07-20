import Middleware from './middleware';

// import HttpMethod from '../enums/httpMethod';
// import Database from '../core/database';
// import log from '../core/logger';
// import utils from '../utils';
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
