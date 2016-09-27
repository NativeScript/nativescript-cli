import NodeHttp from './src/node';
import Promise from 'core-js/es6/promise';
import isArray from 'lodash/isArray';

/**
 * Enum for Http Adapters.
 */
const HttpAdapter = {
  Node: 'Node'
};
Object.freeze(HttpAdapter);

export default class Http {
  constructor(adapters = [HttpAdapter.Node]) {
    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    adapters.some((adapter) => {
      switch (adapter) {
        case HttpAdapter.Node:
          if (NodeHttp.isSupported()) {
            this.adapter = new NodeHttp();
            return true;
          }

          break;
        default:
          // Log.warn(`The ${adapter} adapter is is not recognized.`);
      }

      return false;
    });
  }

  handle(request, response) {
    if (this.adapter) {
      return this.adapter.handle(request, response);
    }

    return Promise.reject(new Error('Unable to handle the request. An adapter is not specified.'));
  }
}
