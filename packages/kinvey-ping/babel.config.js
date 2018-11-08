const path = require('path');

const ROOT_BABEL_CONFIG = path.resolve('..', '..', 'babel.config.js');

module.exports = (api) => {
  api.cache.never();

  if (process.env.NODE_ENV === 'development') {
    return {
      extends: ROOT_BABEL_CONFIG,
      retainLines: true
    };
  }

  return {
    extends: ROOT_BABEL_CONFIG
  };
};
