import { register as registerHttp } from 'kinvey-http-nativescript';
import { register as registerCache } from 'kinvey-cache-memory';
import * as User from 'kinvey-user';

registerHttp();
registerCache();

const BackwardsCompatibleUser = User.User;

Object.keys(User).forEach((key) => {
  const val = User[key];

  if (val !== User.User) {
    BackwardsCompatibleUser[key] = val;
  }
});

export { BackwardsCompatibleUser as User };
