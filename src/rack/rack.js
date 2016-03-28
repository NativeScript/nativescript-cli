import { Middleware, KinveyMiddleware } from './middleware';
import { CacheMiddleware } from './middleware/cache';
import { ParseMiddleware } from './middleware/parse';
import { SerializeMiddleware } from './middleware/serialize';
import findIndex from 'lodash/findIndex';
let sharedCacheRackInstance;
let sharedNetworkRackInstance;

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
        const index = findIndex(middlewares, (existingMiddleware => existingMiddleware instanceof middlewareClass));

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
        const index = findIndex(middlewares, (existingMiddleware => existingMiddleware instanceof middlewareClass));

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
        const index = findIndex(middlewares, (existingMiddleware => existingMiddleware instanceof middlewareClass));

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
    const index = findIndex(middlewares, (existingMiddleware => existingMiddleware instanceof middlewareClass));

    if (index > -1) {
      middlewares.splice(index, 1);
      this.middlewares = middlewares;
      this.remove(middlewareClass);
    }
  }

  reset() {
    this.middlewares = [];
  }

  execute(request) {
    if (!request) {
      return Promise.reject(new Error('Request is null. Please provide a valid request.'));
    }

    return this._execute(0, this.middlewares, request);
  }

  _execute(index, middlewares, request) {
    if (index < -1 || index >= middlewares.length) {
      throw new Error(`Index ${index} is out of bounds.`);
    }

    const middleware = middlewares[index];
    return middleware.handle(request).then(response => {
      index = index + 1;

      if (index < middlewares.length) {
        return this._execute(index, middlewares, response);
      }

      return response;
    });
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
  execute(request) {
    const promise = super.execute(request).then(request => {
      return request.response;
    });
    return promise;
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
    let instance = sharedCacheRackInstance;

    if (!instance) {
      instance = new CacheRack();
      sharedCacheRackInstance = instance;
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
    this.use(new ParseMiddleware());
  }

  static sharedInstance() {
    let instance = sharedNetworkRackInstance;

    if (!instance) {
      instance = new NetworkRack();
      sharedNetworkRackInstance = instance;
    }

    return instance;
  }
}
