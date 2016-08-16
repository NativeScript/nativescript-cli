import { HttpMiddleware as CoreHttpMiddleware, KinveyRackManager } from '../src/rack';
import { HttpMiddleware } from './middleware/http';
import { Kinvey } from '../src/kinvey';
import { User } from '../src/entity';

// Swap Http middleware
const networkRack = KinveyRackManager.networkRack;
networkRack.swap(CoreHttpMiddleware, new HttpMiddleware());

// Init Kinvey
Kinvey.init({
  appKey: 'kid_HkTD2CJc',
  appSecret: 'cd7f658ed0a548dd8dfadf5a1787568b'
});

// Login a user
before(() => User.login('test', 'test'));

// Logout a user
after(() => {
  const user = User.getActiveUser();

  if (user) {
    return user.logout();
  }

  return null;
});

// require all modules ending in ".test" from the
// current directory and all subdirectories
const context = require.context('.', true, /^\.\/.*\.test$/);
context.keys().forEach(context);
