import { Middleware } from './middleware';
import result from 'lodash/result';

/**
 * @private
 */
export class Rack extends Middleware {
  constructor(name = 'Rack') {
    super(name);
    this._middlewares = [];
    this.canceled = false;
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
    request = result(request, 'toJSON', request);
    const promise = super.execute(request).then(request => {
      return request.response;
    });
    return promise;
  }
}
