import { register as registerHttp } from 'kinvey-http-web';
import { register as registerCache } from 'kinvey-cache-indexeddb';

registerHttp();
registerCache();

export * from 'kinvey-datastore';
