const common = require('../babel.config');

module.exports = (api) => {
  const config = common(api);

  config.presets = [
    ['@babel/env', {
      modules: 'umd',
      targets: 'maintained node versions',
      useBuiltIns: 'usage'
    }]
  ];

  return config;
};
