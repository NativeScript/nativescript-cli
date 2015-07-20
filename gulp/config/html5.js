const config = {};

/**
 * Environment variables for the project.
 */
config.env = {
  KINVEY_DATABASE_LIB: 'indexeddbshim',
  KINVEY_HTTP_LIB: 'kinvey-http-xhr',
  KINVEY_PLATFORM_ENV: 'html5'
};

// Export
module.exports = config;
