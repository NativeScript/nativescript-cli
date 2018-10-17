import * as Identity from 'kinvey-identity';

const BackwardsCompatibleIdentity = Identity.User;

Object.keys(Identity).forEach((key) => {
  const val = Identity[key];

  if (val !== Identity.User) {
    BackwardsCompatibleIdentity[key] = val;
  }
});

export { BackwardsCompatibleIdentity as User };
