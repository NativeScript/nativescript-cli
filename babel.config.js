function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

module.exports = (api) => {
  const config = {
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

  // Cache the config
  api.cache.using(() => isDevelopment());

  // Return the config
  return config;
};
