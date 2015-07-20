import Kinvey from '../../../src/kinvey';

export default function userRoutes() {
  // Login
  this.post(`/user/${Kinvey.appKey}`, function() {
    return [200, {}, {
      _id: randomString(),
      username: randomString(),
      password: randomString(),
      _kmd: {
        authtoken: randomString()
      }
    }];
  });
}
