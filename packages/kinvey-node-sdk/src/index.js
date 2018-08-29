import sdk from 'kinvey-js-sdk';
import http from './http';
import * as memory from './memory2';

module.exports = sdk(http, new Map(), null, memory);
