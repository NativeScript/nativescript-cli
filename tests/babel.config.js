module.exports = (api) => {
  api.cache.never();

  return {
    presets: [
      ['@babel/env', {
        targets: 'maintained node versions',
        useBuiltIns: 'usage'
      }]
    ],
    plugins: [
      '@babel/plugin-transform-runtime'
    ],
    retainLines: true,
    sourceMaps: 'inline'
  };
};
