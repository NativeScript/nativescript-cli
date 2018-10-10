import { register as registerHttp } from 'kinvey-http-nativescript';
import { register as registerCache } from 'kinvey-cache-memory';

registerHttp();
registerCache();

export * from 'kinvey-datastore';
