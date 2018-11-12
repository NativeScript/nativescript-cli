module.exports = (api) => {
  api.cache.never();

  if (process.env.NODE_ENV === 'development') {
    return {
      presets: [
        ['@babel/env', {
          targets: 'current node'
        }]
      ],
      retainLines: true,
      sourceMaps: 'inline'
    };
  }

  return {
    presets: [
      ['@babel/env', {
        targets: 'last 2 versions, maintained node versions, not dead',
        useBuiltIns: 'usage',
        modules: 'umd'
      }]
    ],
    plugins: [
      '@babel/plugin-transform-runtime'
    ]
  };
};
