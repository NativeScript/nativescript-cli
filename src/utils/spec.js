import { User } from '../user';
import { randomString } from './string';
import fetchMock from 'fetch-mock';

const UserHelper = {
  login() {
    fetchMock.mock('^https://baas.kinvey.com', 'POST', {
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        _id: randomString(),
        username: randomString(),
        password: randomString(),
        _kmd: {
          authtoken: randomString()
        }
      }
    });

    return User.login('admin', 'admin');
  },

  logout() {
    return User.getActiveUser().then(user => {
      if (user) {
        return user.logout();
      }
    });
  }
};
export { UserHelper };

// // Tests whether both deferreds and callbacks are supported on success.
// export function success(promiseFn) {
//   return function () {
//     const spy = sinon.spy();
//     const promise = promiseFn.call(this, { success: spy }).then(function (value) {
//       // If the spy was called with only one argument, it should equal the
//       // fulfillment value. Otherwise, try to match the array of arguments.
//       let args = spy.lastCall.args;
//       args = args.length === 1 ? args[0] : args;
//       expect(spy).to.be.calledOnce;
//       expect(args).to.deep.equal(value);
//     });
//     return expect(promise).to.be.fulfilled;
//   };
// }

// // Tests whether both deferreds and callbacks are supported on failure.
// export function failure(promiseFn) {
//   return function () {
//     const spy = sinon.spy();
//     const promise = promiseFn.call(this, { error: spy });
//     return promise.then(function () {
//       // We should not reach this code branch.
//       return expect(promise).to.be.rejected;
//     }, function (reason) {
//       // If the spy was called with only one argument, it should equal the
//       // rejection reason. Otherwise, try to match the array of arguments.
//       let args = spy.lastCall.args;
//       args = args.length === 1 ? args[0] : args;
//       expect(spy).to.be.calledOnce;
//       expect(args).to.deep.equal(reason);
//     });
//   };
// }
