const path = require('path');

module.exports = (api) => {
  api.cache.never();

  return {
    extends: path.resolve('..', 'babel.config.js')
  };
};
