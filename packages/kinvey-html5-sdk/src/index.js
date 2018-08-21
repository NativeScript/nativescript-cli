import 'babel-polyfill';
import sdk from 'kinvey-js-sdk';
import http from './http';
import * as sessionStore from './session';
import popup from './popup';
import * as cacheStore from './indexeddb';

module.exports = sdk(http, sessionStore, popup, cacheStore);
