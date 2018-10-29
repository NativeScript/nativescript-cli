module.exports = (api) => {
  api.cache.never();

  const presets = [
    ['@babel/env', {
      targets: 'last 2 versions, maintained node versions, not dead',
      useBuiltIns: 'usage'
    }]
  ];
  const plugins = ['@babel/plugin-transform-runtime'];

  if (process.env.NODE_ENV === 'development') {
    return {
      sourceMaps: true,
      retainLines: true,
      presets,
      plugins
    };
  }

  return {
    presets,
    plugins
  };
};
