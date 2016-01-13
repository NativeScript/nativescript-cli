const AsciiTree = require('./asciiTree');
const UrlPattern = require('url-pattern');
const KinveyError = require('../errors').KinveyError;

class Middleware {
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

class KinveyMiddleware extends Middleware {
  constructor(name = 'Kinvey Middleware') {
    super(name);
  }

  handle(request) {
    return new Promise((resolve, reject) => {
      if (request) {
        const pattern = new UrlPattern('/:namespace/:appId(/)(:collection)(/)(:id)(/)');
        const matches = pattern.match(request.pathname);
        return resolve(matches);
      }

      reject(new KinveyError('Request is null. Please provide a valid request.', request));
    });
  }
}

module.exports = KinveyMiddleware;
