import { AsciiTree } from './asciiTree';

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
      if (!request) {
        return reject(new Error('Request is null. Please provide a valid request.', request));
      }

      return resolve();
    });
  }
}
