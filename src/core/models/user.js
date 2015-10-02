import ActiveUserError from '../errors/activeUserError';
import KinveyError from '../errors/error';
import Model from './model';
import Users from '../collections/users';
import StoreAdapter from '../enums/storeAdapter';
import SocialAdapter from '../enums/socialAdapter';
import Facebook from './social/facebook';
import Google from './social/google';
import LinkedIn from './social/linkedIn';
import Twitter from './social/twitter';
import Store from '../cache/store';
import Kinvey from '../../kinvey';
import isFunction from 'lodash/lang/isFunction';
import when from 'when';
const activeUserSymbol = Symbol();
const activeUserCollection = 'activeUser';

export default class User extends Model {
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * Active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static getActive() {
    let user = User[activeUserSymbol];

    if (!user) {
      return when.resolve(user);
    }

    const client = Kinvey.sharedClientInstance();
    const store = new Store(StoreAdapter.LocalStorage, {
      name: client.appKey,
      collection: activeUserCollection
    });

    return store.find().then(users => {
      if (users.length === 0) {
        return null;
      }

      user = new User(users[0]);
      User[activeUserSymbol] = user;
      return user;
    });
  }

  /**
   * Stores the active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static setActive(user) {
    const client = Kinvey.sharedClientInstance();
    const store = new Store(StoreAdapter.LocalStorage, {
      name: client.appKey,
      collection: activeUserCollection
    });

    const promise = User.getActive().then(activeUser => {
      if (activeUser) {
        return store.delete(activeUser.id).then(() => {
          User[activeUserSymbol] = null;
        });
      }
    }).then(() => {
      if (user) {
        if (!(user instanceof User)) {
          user = new User(isFunction(user.toJSON) ? user.toJSON() : user);
        }

        return store.save(user.toJSON()).then(() => {
          User[activeUserSymbol] = user;
          return user;
        });
      }
    });

    return promise;
  }

  /**
   * Checks if the user is active.
   *
   * @returns {Promise} Resolved with `true` if the user is active, `false` otherwise.
   */
  isActive() {
    return User.getActive().then(user => {
      if (user) {
        return this.id === user.id;
      }

      return false;
    });
  }

  /**
   * Login a Kinvey user.
   *
   * @param   {Object|string} usernameOrData      Username, or user data.
   * @param   {string}        [password]          Password
   * @param   {Options}       [options]           Options
   * @returns {Promise}                           Resolved with the active user or rejected with an error.
  */
  static login(usernameOrData, password, options = {}) {
    const promise = User.getActive().then(user => {
      if (user) {
        throw new ActiveUserError('A user is already logged in.');
      }

      const collection = new Users();
      return collection.login(usernameOrData, password, options);
    }).then((data) => {
      const user = new User(data);
      return User.setActive(user).then(() => {
        return user;
      });
    });

    return promise;
  }

  /**
   * Login a Kinvey user using a provider.
   *
   * @param   {string}        provider            Provider
   * @param   {Object}        token               Token
   * @param   {string}        token.access_token  Access token
   * @param   {number}        token.expires_in    Expires in
   * @param   {Options}       [options]           Options
   * @returns {Promise}                           Resolved with the active user or rejected with an error.
  */
  static loginWithProvider(provider, token = {}, options) {
    if (!isString(provider)) {
      provider = String(provider);
    }

    if (!token.access_token || !token.expires_in) {
      return when.reject(new KinveyError('token argument must contain both an `access_token` and `expires_in` property.', token));
    }

    var data = { _socialIdentity: { } };
    data._socialIdentity[provider] = tokens;
    return User.login(data, options);
  }

  /**
   * Logout the active user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The previous active user.
   */
  logout(options = {}) {
    const promise = this.isActive().then(active => {
      if (!active) {
        return null;
      }

      const collection = new Users();
      return collection.logout(options);
    }).then(() => {
      return User.setActive(null);
    });

    return promise;
  }

  /**
   * Connect with a social identity to login a user.
   *
   * @param   {string|Object}      Adapter          Social Adapter
   * @return  {Promise}                             Resolved with the active user or rejected with an error.
   */
  connect(Adapter = SocialAdapter.Facebook) {
    let adapter = Adapter;
    let promise;

    if (isString(Adapter)) {
      switch (Adapter) {
      case SocialAdapter.Google:
        Adapter = Google;
        break;
      case SocialAdapter.LinkedIn:
        Adapter = LinkedIn;
        break;
      case SocialAdapter.Twitter:
        Adapter = Twitter;
        break;
      default:
        Adapter = Facebook;
    }

    if (isFunction(Adapter)) {
      adapter = new Adapter();
    }

    if (!isFunction(adapter.connect)) {
      return when.reject(new KinveyError('Unable to connect with the social adapter.', 'Please provide an `connect` function for the adapter.'));
    }

    promise = adapter.connect().then((tokens) => {
      return User.loginWithProvider(adapter.name, tokens);
    });

    return promise;
  }
}
