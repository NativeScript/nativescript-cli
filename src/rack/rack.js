const clone = require('lodash/lang/clone');
const Response = require('../core/response');
const Serialize = require('./serialize');
const Http = require('./http');
const Parse = require('./parse');
const Cache = require('./cache');
const Middleware = require('./middleware');
const result = require('lodash/object/result');
const networkRackSymbol = Symbol();
const cacheRackSymbol = Symbol();

function execute(index, middlewares, request) {
  // Throw error of an index that is out of bounds
  if (index < -1 || index >= middlewares.length) {
    throw new Error(`Index ${index} is out of bounds.`);
  }

  // Get the middleware at index
  const middleware = middlewares[index];

  // Process the request on the middleware
  return middleware.handle(request).then(response => {
    // Add 1 to the index
    index = index + 1;

    // Execute the next middleware in the stack
    if (index < middlewares.length) {
      return execute.call(this, index, middlewares, response);
    }

    return response;
  });
}

class Rack extends Middleware {
  constructor(name = 'Rack') {
    super(name);
    this._middlewares = [];
  }

  get middlewares() {
    return this._middlewares.slice();
  }

  getMiddleware(index = -1) {
    const middlewares = this.middlewares;

    if (index < -1 || index >= middlewares.length) {
      throw new Error(`Index ${index} is out of bounds.`);
    }

    return middlewares[index];
  }

  use(middleware) {
    if (middleware) {
      if (middleware instanceof Middleware) {
        this._middlewares.push(middleware);
        return;
      }

      throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
    }
  }

  useBefore(middlewareClass, middleware) {
    if (middleware) {
      if (middleware instanceof Middleware) {
        const middlewares = this.middlewares;
        const index = middlewares.findIndex(existingMiddleware => existingMiddleware instanceof middlewareClass);

        if (index > -1) {
          middlewares.splice(index, 0, middleware);
          this._middlewares = middlewares;
        }

        return;
      }

      throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
    }
  }

  useAfter(middlewareClass, middleware) {
    if (middleware) {
      if (middleware instanceof Middleware) {
        const middlewares = this.middlewares;
        const index = middlewares.findIndex(existingMiddleware => existingMiddleware instanceof middlewareClass);

        if (index > -1) {
          middlewares.splice(index + 1, 0, middleware);
          this._middlewares = middlewares;
        }

        return;
      }

      throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
    }
  }

  swap(middlewareClass, middleware) {
    if (middleware) {
      if (middleware instanceof Middleware) {
        const middlewares = this.middlewares;
        const index = middlewares.findIndex(existingMiddleware => existingMiddleware instanceof middlewareClass);

        if (index > -1) {
          middlewares.splice(index, 1, middleware);
          this._middlewares = middlewares;
        }

        return;
      }

      throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
    }
  }

  remove(middlewareClass) {
    const middlewares = this.middlewares;
    const index = middlewares.findIndex(existingMiddleware => existingMiddleware instanceof middlewareClass);

    if (index > -1) {
      middlewares.splice(index, 1);
      this._middlewares = middlewares;
      this.remove(middlewareClass);
    }
  }

  reset() {
    this._middlewares = [];
  }

  execute(request) {
    return execute.call(this, 0, this.middlewares, request);
  }

  handle(request) {
    return this.execute(request);
  }

  generateTree(level = 0) {
    const root = super.generateTree(level);
    const middlewares = this.middlewares;

    middlewares.forEach((middleware) => {
      root.nodes.push(middleware.generateTree(level + 1));
    });

    return root;
  }
}

class KinveyRack extends Rack {
  static get networkRack() {
    if (!KinveyRack[networkRackSymbol]) {
      const rack = new KinveyRack('Kinvey Network Rack');
      rack.use(new Serialize());
      rack.use(new Http());
      rack.use(new Parse());
      Rack[networkRackSymbol] = rack;
    }

    return KinveyRack[networkRackSymbol];
  }

  static set networkRack(rack) {
    KinveyRack[networkRackSymbol] = rack;
  }

  static get cacheRack() {
    if (!KinveyRack[cacheRackSymbol]) {
      const rack = new KinveyRack('Kinvey Cache Rack');
      rack.use(new Cache());
      KinveyRack[cacheRackSymbol] = rack;
    }

    return KinveyRack[cacheRackSymbol];
  }

  static set cacheRack(rack) {
    KinveyRack[cacheRackSymbol] = rack;
  }

  execute(request) {
    const requestClone = clone(result(request, 'toJSON', request));
    const promise = super.execute(requestClone).then(request => {
      const response = request.response;

      if (response) {
        return new Response(response.statusCode, response.headers, response.data);
      }

      return response;
    });
    return promise;
  }
}

module.exports = KinveyRack;
