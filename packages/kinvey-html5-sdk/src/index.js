import { register as registerCacheStore } from 'kinvey-cache-indexeddb';
import { register as registerHttpAdapter } from 'kinvey-http-web';
import { register as registerSessionStore } from 'kinvey-session-web';
import { register as registerPopup } from 'kinvey-popup-web';
import * as App from 'kinvey-app';
import * as Identity from 'kinvey-identity';

registerCacheStore();
registerHttpAdapter();
registerSessionStore();
registerPopup();

const Kinvey = {
  User: Identity
};

Object.keys(App).forEach((key) => {
  Kinvey[key] = App[key];
});

module.exports = Kinvey;
