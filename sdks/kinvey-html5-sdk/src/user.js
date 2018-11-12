import * as User from 'kinvey-user';

const BackwardsCompatibleUser = User.User;

Object.keys(User).forEach((key) => {
  const val = User[key];

  if (val !== User.User) {
    BackwardsCompatibleUser[key] = val;
  }
});

export { BackwardsCompatibleUser as User };
