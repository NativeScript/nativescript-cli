import { AsciiTree } from './asciiTree';
import UrlPattern from 'url-pattern';
import { KinveyError } from '../errors';
import url from 'url';

/**
 * @private
 */
export class Middleware {
  constructor(name = 'Middleware') {
    this.name = name;
  }

  handle(request = {}) {
    return Promise.resolve(request);
  }

  generateTree(level = 0) {
    const root = {
      value: this.name,
      level: level,
      nodes: []
    };
    return root;
  }

  toString() {
    const root = this.generateTree();
    return AsciiTree.generate(root);
  }
}

/**
 * @private
 */
export class KinveyMiddleware extends Middleware {
  constructor(name = 'Kinvey Middleware') {
    super(name);
  }

  handle(request) {
    return new Promise((resolve, reject) => {
      if (request) {
        const pathname = url.parse(request.url).pathname;
        const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:id)(/)');
        const matches = pattern.match(pathname) || {};
        return resolve({
          namespace: matches.namespace,
          appKey: matches.appKey,
          collection: matches.collection,
          id: matches.id
        });
      }

      reject(new KinveyError('Request is null. Please provide a valid request.', request));
    });
  }
}
