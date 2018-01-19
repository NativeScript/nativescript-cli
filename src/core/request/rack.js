import Promise from 'es6-promise';
import reduce from 'lodash/reduce';
import isFunction from 'lodash/isFunction';
import values from 'lodash/values';
import { isDefined } from '../utils';
import { Log } from '../log';
import { Middleware, HttpMiddleware, ParseMiddleware, SerializeMiddleware } from './middleware';

export class Rack extends Middleware {
  constructor(name = 'Rack') {
    super(name);
    this.middlewares = [];
    this.canceled = false;
    this.activeMiddleware = undefined;
  }

  use(middleware) {
    if (isDefined(middleware)) {
      if (middleware instanceof Middleware) {
        this.middlewares.push(middleware);
        return;
      }

      throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
    }
  }

  reset() {
    this.middlewares = [];
  }

  execute(req) {
    if (isDefined(req) === false) {
      return Promise.reject(new Error('Request is undefined. Please provide a valid request.'));
    }

    return reduce(values(this.middlewares),
      (promise, middleware) => promise.then(({ request, response }) => {
        if (this.canceled) {
          return Promise.reject(new Error('Cancelled'));
        }

        this.activeMiddleware = middleware;
        return middleware.handle(request || req, response);
      }), Promise.resolve({ request: req }))
      .then(({ response }) => {
        if (this.canceled === true) {
          return Promise.reject(new Error('Cancelled'));
        }

        this.canceled = false;
        this.activeMiddleware = undefined;
        return response;
      })
      .catch((error) => {
        this.canceled = false;
        this.activeMiddleware = undefined;
        throw error;
      });
  }

  cancel() {
    this.canceled = true;

    if (isDefined(this.activeMiddleware) && isFunction(this.activeMiddleware.cancel)) {
      return this.activeMiddleware.cancel();
    }

    return Promise.resolve();
  }

  handle(request) {
    return this.execute(request);
  }

  generateTree(level = 0) {
    const root = super.generateTree(level);

    values(this.middlewares).forEach((middleware) => {
      root.nodes.push(middleware.generateTree(level + 1));
    });

    return root;
  }
}

class NetworkRack extends Rack {
  constructor(name = 'Network Rack') {
    super(name);
    this.use(new SerializeMiddleware());
    this.use(new HttpMiddleware());
    this.use(new ParseMiddleware());
  }

  useHttpMiddleware(httpMiddleware) {
    this.reset();
    this.use(new SerializeMiddleware());
    this.use(httpMiddleware);
    this.use(new ParseMiddleware());
  }

  execute(request) {
    Log.debug('Executing network request', request);
    return super.execute(request)
      .then((response) => {
        Log.debug(`Received response for network request: ${request.id}`, response);
        return response;
      })
      .catch((error) => {
        Log.error(`Received error for network request id: ${request.id}`, error);
        throw error;
      });
  }
}
const networkRack = new NetworkRack();


export {
  networkRack as NetworkRack
};
