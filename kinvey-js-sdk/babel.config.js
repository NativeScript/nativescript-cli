module.exports = (api) => {
  api.cache(false);

  const presets = [
    ['@babel/env', {
      useBuiltIns: 'usage'
    }]
  ];
  const plugins = ['@babel/plugin-transform-runtime'];

  return {
    presets,
    plugins
  };
};
