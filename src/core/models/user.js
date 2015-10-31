import { ActiveUserError, KinveyError } from '../errors';
import Model from './model';
import Users from '../datastores/users';
import SocialAdapter from '../enums/socialAdapter';
import Facebook from '../social/facebook';
import Google from '../social/google';
import LinkedIn from '../social/linkedIn';
import Twitter from '../social/twitter';
import { getActiveUser, setActiveUser } from '../../utils/user';
import isFunction from 'lodash/lang/isFunction';
import isString from 'lodash/lang/isString';
import Promise from 'bluebird';
const activeUserSymbol = Symbol();

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
    const user = User[activeUserSymbol];

    if (!user) {
      return Promise.resolve(user);
    }

    return getActiveUser().then(user => {
      if (user) {
        user = new User(user);
        User[activeUserSymbol] = user;
        return user;
      }

      return null;
    });
  }

  /**
   * Stores the active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static setActive(user) {
    if (user && !(user instanceof User)) {
      user = new User(result(user, 'toJSON', user));
    }

    return setActiveUser(user ? user.toJSON() : user).then(() => {
      if (user) {
        User[activeUserSymbol] = user;
        return user;
      }

      return null;
    });
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
      return Promise.reject(new KinveyError('token argument must contain both an access_token and expires_in property.', token));
    }

    const data = { _socialIdentity: { } };
    data._socialIdentity[provider] = token;
    return User.login(data, options);
  }

  /**
   * Connect with a social identity.
   *
   * @param   {string|Object}      Adapter          Social Adapter
   * @return  {Promise}                             Resolved with the active user or rejected with an error.
   */
  static connect(Adapter = SocialAdapter.Facebook, options) {
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
    }

    if (isFunction(Adapter)) {
      adapter = new Adapter();
    }

    if (!isFunction(adapter.connect)) {
      return Promise.reject(new KinveyError('Unable to connect with the social adapter.', 'Please provide a connect function for the adapter.'));
    }

    promise = adapter.connect(options).then((token) => {
      return User.loginWithProvider(adapter.name, token, options);
    });

    return promise;
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
}
