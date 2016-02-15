const User = require('../core/models/user');
const Users = require('../core/stores/users');
const map = require('lodash/map');
const mapLegacyOptions = require('./utils').mapLegacyOptions;
const wrapCallbacks = require('./utils').wrapCallbacks;

class LegacyUser {
  /**
   * Get the active user.
   *
   * @param   {Object}    Options
   * @return  {Promise}   Resolved with the active user null.
   */
  static getActive(options = {}) {
    options = mapLegacyOptions(options);

    const promise = User.getActive(options.client).then(user => {
      if (user) {
        return user.toJSON();
      }

      return null;
    });

    return wrapCallbacks(promise, options);
  }

  /**
   * Set the active user.
   *
   * @param   {User}      User
   * @param   {Object}    Options
   * @return  {Promise}   Resolved with the active user or null.
   */
  static setActive(user, options = {}) {
    options = mapLegacyOptions(options);

    const promise = User.setActive(user, options.client).then(user => {
      if (user) {
        return user.toJSON();
      }

      return null;
    });

    return wrapCallbacks(promise, options);
  }

  static signup(data, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.signup(data, options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static signupWithProvider(provider, tokens, options = {}) {
    const data = {
      _socialIdentity: {}
    };
    data._socialIdentity[provider] = tokens;
    return LegacyUser.signup(data, options);
  }

  static login(usernameOrData, password, options) {
    options = mapLegacyOptions(options);

    const promise = User.login(usernameOrData, password, options).then(user => {
      return user.toJSON();
    });

    return wrapCallbacks(promise, options);
  }

  static logout(options = {}) {
    options = mapLegacyOptions(options);

    const promise = User.getActive(options.client).then(user => {
      if (user) {
        return user.logout(options);
      }

      return null;
    });

    return wrapCallbacks(promise, options);
  }

  static me(options = {}) {
    options = mapLegacyOptions(options);

    const promise = User.getActive(options.client).then(user => {
      if (user) {
        return user.me(options);
      }

      return null;
    });

    return wrapCallbacks(promise, options);
  }

  static verifyEmail(username, options = {}) {
    options = mapLegacyOptions(options);

    const user = new User({
      username: username
    });
    const promise = user.verifyEmail(options);

    return wrapCallbacks(promise, options);
  }

  static forgotUsername(email, options = {}) {
    options = mapLegacyOptions(options);

    const user = new User({
      email: email
    });
    const promise = user.forgotUsername(options);

    return wrapCallbacks(promise, options);
  }

  static resetPassword(username, options = {}) {
    options = mapLegacyOptions(options);

    const user = new User({
      username: username
    });
    const promise = user.resetPassword(options);

    return wrapCallbacks(promise, options);
  }

  static find(query, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.find(query, options).then(users => {
      return map(users, user => {
        return user.toJSON();
      });
    });

    return wrapCallbacks(promise, options);
  }

  static group(aggregation, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.group(aggregation, options).then(users => {
      return map(users, user => {
        return user.toJSON();
      });
    });
    return wrapCallbacks(promise, options);
  }

  static count(query, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.count(query, options);
    return wrapCallbacks(promise, options);
  }

  static get(id, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.get(id, options).then(user => {
      return user.toJSON();
    });

    return wrapCallbacks(promise, options);
  }

  static create(data, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.create(data, options).then(user => {
      return user.toJSON();
    });

    return wrapCallbacks(promise, options);
  }

  static update(data, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.update(data, options).then(user => {
      return user.toJSON();
    });

    return wrapCallbacks(promise, options);
  }

  static destroy(id, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.delete(id, options);
    return wrapCallbacks(promise, options);
  }

  static exists(username, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.exists(username, options);
    return wrapCallbacks(promise, options);
  }

  static restore(id, options = {}) {
    options = mapLegacyOptions(options);

    const users = new Users();
    const promise = users.restore(id, options);
    return wrapCallbacks(promise, options);
  }
}

module.exports = LegacyUser;
