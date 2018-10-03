import { register as registerCacheStore } from 'kinvey-cache-indexeddb';
import { register as registerHttpAdapter } from 'kinvey-http-web';
import { register as registerSessionStore } from 'kinvey-session-web';
// import { use as useCacheStore } from 'kinvey-cache';
// import { init } from 'kinvey-app';
// import * as cacheStore from 'kinvey-indexeddb';

// import * as sessionStore from './session';
// import popup from './popup';

registerCacheStore();
registerHttpAdapter();
registerSessionStore();

export * from 'kinvey-app';
