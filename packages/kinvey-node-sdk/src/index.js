import sdk from 'kinvey-js-sdk';
import http from './http';
import * as memory from './memory';

module.exports = sdk(http, null, null, memory);
