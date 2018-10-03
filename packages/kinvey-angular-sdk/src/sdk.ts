import { init } from 'kinvey-js-sdk/lib/client';
import http from './http';
import * as sessionStore from './session';
import popup from './popup';
import * as cacheStore from './indexeddb';

sdk(http, sessionStore, popup, cacheStore);
