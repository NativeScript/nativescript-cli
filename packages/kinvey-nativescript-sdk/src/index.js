import sdk from 'kinvey-js-sdk';
import httpAdapter from './http';

module.exports = sdk(httpAdapter);
