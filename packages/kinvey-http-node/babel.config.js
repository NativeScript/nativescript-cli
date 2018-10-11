module.exports = (api) => {
  api.cache.never();

  const presets = [
    ['@babel/env', {
      targets: 'last 2 versions, maintained node versions, not dead',
      useBuiltIns: 'usage'
    }]
  ];
  const plugins = ['@babel/plugin-transform-runtime'];

  return {
    presets,
    plugins
  };
};
