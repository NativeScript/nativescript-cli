import { register as registerHttp } from 'kinvey-http-web';
import { register as registerPopup } from 'kinvey-popup-web';
import { register as registerCache } from 'kinvey-cache-indexeddb';
import * as Identity from 'kinvey-identity';

registerHttp();
registerPopup();
registerCache();

const BackwardsCompatibleIdentity = Identity.User;

Object.keys(Identity).forEach((key) => {
  const val = Identity[key];

  if (val !== Identity.User) {
    BackwardsCompatibleIdentity[key] = val;
  }
});

export { BackwardsCompatibleIdentity as User };
