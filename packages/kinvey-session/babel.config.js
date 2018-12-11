function isDevelopment() {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
}

module.exports = (api) => {
  // Cache the config
  api.cache.using(() => isDevelopment());

  // Create the default config
  const config = {
    comments: false,
    presets: [
      ['@babel/env', {
        modules: 'umd',
        targets: 'last 2 versions, maintained node versions, not dead'
      }]
    ],
    plugins: [
      '@babel/plugin-transform-runtime'
    ]
  };

  // Turn on source maps
  if (isDevelopment()) {
    config.sourceMaps = 'inline';
  }

  // Return the config
  return config;
};
