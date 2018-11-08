const path = require('path');

module.exports = (api) => {
  api.cache.using(() => process.env.NODE_ENV);

  return {
    extends: path.resolve('..', '..', 'babel.config.js')
  };
};
