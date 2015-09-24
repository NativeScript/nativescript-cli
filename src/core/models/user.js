import ActiveUserError from '../errors/activeUserError';
import Storage from '../storage';
import Model from './model';
import Users from '../collections/users';
import when from 'when';
const activeUserSymbol = Symbol();
const activeUserKey = 'activeUser';

export default class User extends Model {
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * Current user that is logged in.
   *
   * @return {User} The current user.
   */
  static get active() {
    let user = User[activeUserSymbol];
    const storage = Storage.sharedInstance();

    if (!user) {
      const storedUser = storage.get(activeUserKey);

      if (storedUser) {
        user = new User(storedUser);
        User[activeUserSymbol] = user;
      }
    }

    return user;
  }

  static set active(user) {
    let activeUser = User.active;
    const storage = Storage.sharedInstance();

    if (activeUser) {
      storage.delete(activeUserKey);
      User[activeUserSymbol] = null;
    }

    if (user) {
      if (!(user instanceof User)) {
        if (isFunction(user.toJSON)) {
          user = user.toJSON();
        }

        activeUser = new User(user);
      } else {
        activeUser = user;
      }

      storage.set(activeUserKey, activeUser.toJSON());
      User[activeUserSymbol] = currentUser;
    }
  }

  /**
   * Checks if the user is active.
   *
   * @returns {Boolean} `true` if the user is active, `false` otherwise.
   */
  isActive() {
    const activeUser = User.active;

    if (activeUser) {
      return this.id === activeUser.id;
    }

    return false;
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
    if (User.active) {
      return when.reject(new ActiveUserError('A user is already logged in.'));
    }

    const collection = new Users();
    const promise = collection.login(usernameOrData, password, options);

    promise = promise.then((user) => {
      User.active = user;
      return user;
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
    if (!this.isActive()) {
      return when.resolve();
    }

    const collection = new Users();
    const promise = collection.logout(options);

    promise = promise.then(() => {
      User.active = null;
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
