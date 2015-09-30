import ActiveUserError from '../errors/activeUserError';
import Model from './model';
import Users from '../collections/users';
import StoreAdapter from '../enums/storeAdapter';
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
   * Current user that is logged in.
   *
   * @return {User} The current user.
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
        });
      }
    });

    return promise;
  }

  /**
   * Checks if the user is active.
   *
   * @returns {Boolean} `true` if the user is active, `false` otherwise.
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
   * Logs in an existing user.
   * NOTE If `options._provider`, this method should trigger a BL script.
   *
   * @param   {Object|string} usernameOrData      Username, or user data.
   * @param   {string}        [password]          Password.
   * @param   {Options}       [options]           Options.
   * @param   {boolean}       [options._provider] Login via Business Logic. May only
   *                                              be used internally to provide social
   *                                              login for browsers.
   * @returns {Promise}                           The active user.
  */
  static login(usernameOrData, password, options = {}) {
    const promise = User.getActive().then(user => {
      if (user) {
        throw new ActiveUserError('A user is already logged in.');
      }

      const collection = new Users();
      return collection.login(usernameOrData, password, options);
    }).then((user) => {
      return User.setActive(user).then(() => {
        return user;
      });
    });

    return promise;
  }

  /**
   * Logs out the user.
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

  verifyEmail(options = {}) {
    const collection = new Users();
    return collection.verifyEmail(this, options);
  }

  static verifyEmail(username, options = {}) {
    const user = new User({
      username: username
    });
    return user.verifyEmail(options);
  }

  forgotUsername(options = {}) {
    const collection = new Users();
    return collection.forgotUsername(this, options);
  }

  static forgotUsername(email, options = {}) {
    const user = new User({
      email: email
    });
    return user.forgotUsername(options);
  }

  resetPassword(options = {}) {
    const collection = new Users();
    return collection.resetPassword(this, options);
  }

  static resetPassword(username, options = {}) {
    const user = new User({
      username: username
    });
    return user.resetPassword(options);
  }

  exists(options = {}) {
    const collection = new Users();
    return collection.exists(this, options);
  }

  static exists(username, options = {}) {
    const user = new User({
      username: username
    });
    return user.exists(options);
  }

  find(query, options = {}) {
    const collection = new Users();
    return collection.find(query, options);
  }

  get(options = {}) {
    const collection = new Users();
    return collection.get(this, options);
  }

  static get(id, options = {}) {
    const user = new User({
      _id: id
    });
    return user.get(options);
  }

  save(options = {}) {
    const collection = new Users();
    return collection.save(this, options);
  }

  create(options = {}) {
    return this.save(options);
  }

  static create(data, options = {}) {
    const user = new User(data);
    return user.create(options);
  }

  update(options = {}) {
    return this.save(options);
  }

  static update(data, options = {}) {
    const user = new User(data);
    return user.update(options);
  }

  destroy(options = {}) {
    const collection = new Users();
    return collection.destroy(this, options);
  }

  static destroy(id, options = {}) {
    const user = new User({
      _id: id
    });
    return user.destroy(options);
  }

  restore(options = {}) {
    const collection = new Users();
    return collection.restore(this, options);
  }

  static restore(id, options = {}) {
    const user = new User({
      _id: id
    });
    return user.restore(options);
  }

  count(query, options = {}) {
    const collection = new Users();
    return collection.count(query, options);
  }

  static count(query, options = {}) {
    const user = new User();
    return user.count(query, options);
  }

  group(aggregation, options = {}) {
    const collection = new Users();
    return collection.group(aggregation, options);
  }

  static group(aggregation, options = {}) {
    const user = new User();
    return user.group(aggregation, options);
  }
}
