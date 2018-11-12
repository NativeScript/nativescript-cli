module.exports = (api) => {
  api.cache.never();

  return {
    presets: [
      ['@babel/env', {
        targets: 'last 2 versions, maintained node versions, not dead',
        useBuiltIns: 'usage'
      }]
    ],
    plugins: [
      '@babel/plugin-transform-runtime'
    ]
  };
};
