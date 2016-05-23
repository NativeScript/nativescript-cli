import { Middleware, KinveyMiddleware } from './middleware';
import { CacheMiddleware } from './middleware/cache';
import { ParseMiddleware } from './middleware/parse';
import { SerializeMiddleware } from './middleware/serialize';
import { HttpMiddleware } from './middleware/http';
import findIndex from 'lodash/findIndex';
import reduce from 'lodash/reduce';
import Symbol from 'es6-symbol';
const sharedCacheRackInstance = Symbol();
const sharedNetworkRackInstance = Symbol();

/**
 * @private
 */
export class Rack extends KinveyMiddleware {
  constructor(name = 'Rack') {
    super(name);
    this.middlewares = [];
    this.canceled = false;
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
      if (middleware instanceof KinveyMiddleware) {
        this.middlewares.push(middleware);
        return;
      }

      throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
    }
  }

  useBefore(middlewareClass, middleware) {
    if (middleware) {
      if (middleware instanceof Middleware) {
        const middlewares = this.middlewares;
        const index = findIndex(middlewares, existingMiddleware => existingMiddleware instanceof middlewareClass);

        if (index > -1) {
          middlewares.splice(index, 0, middleware);
          this.middlewares = middlewares;
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
        const index = findIndex(middlewares, existingMiddleware => existingMiddleware instanceof middlewareClass);

        if (index > -1) {
          middlewares.splice(index + 1, 0, middleware);
          this.middlewares = middlewares;
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
        const index = findIndex(middlewares, existingMiddleware => existingMiddleware instanceof middlewareClass);

        if (index > -1) {
          middlewares.splice(index, 1, middleware);
          this.middlewares = middlewares;
        }

        return;
      }

      throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
    }
  }

  remove(middlewareClass) {
    const middlewares = this.middlewares;
    const index = findIndex(middlewares, existingMiddleware => existingMiddleware instanceof middlewareClass);

    if (index > -1) {
      middlewares.splice(index, 1);
      this.middlewares = middlewares;
      this.remove(middlewareClass);
    }
  }

  reset() {
    this.middlewares = [];
  }

  async execute(request) {
    if (!request) {
      throw new Error('Request is null. Please provide a valid request.');
    }

    return reduce(this.middlewares,
                  (promise, middleware) => promise.then(request => middleware.handle(request)),
                  Promise.resolve(request));
  }

  cancel() {
    this.canceled = true;
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

/**
 * @private
 */
export class KinveyRack extends Rack {
  async execute(request) {
    request = await super.execute(request);
    return request.response;
  }
}

/**
 * @private
 */
export class CacheRack extends KinveyRack {
  constructor(name = 'Kinvey Cache Rack') {
    super(name);
    this.use(new CacheMiddleware());
  }

  static sharedInstance() {
    let instance = this[sharedCacheRackInstance];

    if (!instance) {
      instance = new CacheRack();
      this[sharedCacheRackInstance] = instance;
    }

    return instance;
  }
}

/**
 * @private
 */
export class NetworkRack extends KinveyRack {
  constructor(name = 'Kinvey Network Rack') {
    super(name);
    this.use(new SerializeMiddleware());
    this.use(new HttpMiddleware());
    this.use(new ParseMiddleware());
  }

  static sharedInstance() {
    let instance = this[sharedNetworkRackInstance];

    if (!instance) {
      instance = new NetworkRack();
      this[sharedNetworkRackInstance] = instance;
    }

    return instance;
  }
}
