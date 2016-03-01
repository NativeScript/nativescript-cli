import { User } from '../src/user';
import { KinveyError } from '../src/errors';
import { wrapCallbacks } from './utils';
const supportedProviders = ['facebook', 'google', 'linkedIn'];

export class Social {
  static connect(data, provider, options) {
    const promise = Promise.resolve().then(() => {
      if (!Social.isSupported(provider)) {
        throw new KinveyError('provider argument is not supported.');
      }

      return User.connectWithIdentity(provider, options);
    }).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static disconnect(data, provider, options) {
    const user = new User(data);
    const promise = user.disconnect(provider, options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static facebook(data, options) {
    const user = new User(data);
    const promise = user.connectWithFacebook(options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static google(data, options) {
    const user = new User(data);
    const promise = user.connectWithGoogle(options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static linkedIn(data, options) {
    const user = new User(data);
    const promise = user.connectWithLinkedIn(options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static twitter(data, options) {
    const promise = Promise.reject(new KinveyError('Connecting with Twitter is no ' +
      'longer supported.'));
    return wrapCallbacks(promise, options);
  }

  static isSupported(provider) {
    return supportedProviders.indexOf(provider) !== -1;
  }
}
