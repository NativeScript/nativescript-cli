import { Acl } from 'kinvey-acl';
import * as App from 'kinvey-app';
import * as User from 'kinvey-user';
import { ping } from 'kinvey-ping';

// SDK
const SDK = {
  ping,

  // Acl
  Acl,

  // User
  User
};

// Flatten App onto SDK
Object.keys(App).forEach((key) => {
  SDK[key] = App[key];
});

// Export
module.exports = SDK;
