function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

module.exports = (api) => {
  const config = {
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

  // Cache the config
  api.cache.using(() => isDevelopment());

  // Add inline source maps
  if (isDevelopment()) {
    config.sourceMaps = 'inline';
  }

  return config;
};
