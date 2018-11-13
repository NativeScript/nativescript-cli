const common = require('../babel.config');

function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

module.exports = (api) => {
  const config = common(api);

  // Add inline source maps
  if (isDevelopment()) {
    config.sourceMaps = 'inline';
  }

  // Return the config
  return config;
};
