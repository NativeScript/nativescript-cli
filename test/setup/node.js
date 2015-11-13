// Setup Environment
process.env.API_PROTOCOL = 'https';
process.env.API_HOSTNAME = 'baas.kinvey.com';
process.env.API_VERSION = 3;
process.env.PLATFORM_ENV = 'node';

// Setup
require('./setup')();
