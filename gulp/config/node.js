const config = {};

/**
 * Environment variables for the project.
 */
config.env = {
  KINVEY_INDEXEDDB_LIB: 'fake-indexeddb',
  KINVEY_HTTP_LIB: 'kinvey-http-node',
  KINVEY_PLATFORM_ENV: 'node'
};

// Export
module.exports = config;
