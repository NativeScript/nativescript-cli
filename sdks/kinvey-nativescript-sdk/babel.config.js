const common = require('../babel.config');

module.exports = (api) => {
  const config = common(api);

  config.presets = [
    ['@babel/env', {
      targets: 'last 2 versions, maintained node versions, not dead'
    }]
  ];

  return config;
};
