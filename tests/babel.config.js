module.exports = (api) => {
  api.cache.never();

  const config = {
    plugins: [
      '@babel/plugin-transform-runtime'
    ],
    presets: [
      ['@babel/env', {
        targets: 'maintained node versions',
        useBuiltIns: 'usage'
      }]
    ]
  };

  return config;
};
