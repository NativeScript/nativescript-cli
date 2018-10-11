import { register as registerHttp } from 'kinvey-http-node';
import { register as registerCache } from 'kinvey-cache-memory';
import * as Identity from 'kinvey-identity';

registerHttp();
registerCache();

const BackwardsCompatibleIdentity = Identity.User;

Object.keys(Identity).forEach((key) => {
  const val = Identity[key];

  if (val !== Identity.User) {
    BackwardsCompatibleIdentity[key] = val;
  }
});

export { BackwardsCompatibleIdentity as User };
