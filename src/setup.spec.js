import { Kinvey } from '../src/kinvey';
import { randomString } from '../src/utils/string';

before(function() {
  this.client = Kinvey.init({
    appKey: randomString(),
    appSecret: randomString()
  });
});

after(function() {
  delete this.client;
});
