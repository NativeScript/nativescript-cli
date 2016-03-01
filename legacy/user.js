import { User as CoreUser } from '../src/user';
import { UsersStore } from '../src/stores/usersStore';
import { wrapCallbacks } from './utils';
import map from 'lodash/map';

export class User {
  static signup(data, options = {}) {
    options.state = true;
    const promise = CoreUser.signup(data, options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(options, promise);
  }

  static signupWithProvider(identity, tokens, options = {}) {
    options.state = true;
    const promise = CoreUser.singupWithIdentity(identity, tokens, options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(options, promise);
  }

  static login(usernameOrData, password, options) {
    const promise = CoreUser.login(usernameOrData, password, options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(options, promise);
  }

  static loginWithProvider(identity, tokens, options) {
    const promise = CoreUser.loginWithIdentity(identity, tokens, options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(options, promise);
  }

  static logout(options) {
    const promise = CoreUser.getActiveUser().then(user => {
      if (user) {
        return user.logout(options);
      }

      return null;
    });
    return wrapCallbacks(options, promise);
  }

  static me(options) {
    const promise = CoreUser.getActiveUser().then(user => {
      if (user) {
        return user.me(options);
      }

      return null;
    });
    return wrapCallbacks(options, promise);
  }

  static verifyEmail(username, options) {
    const user = new CoreUser({
      username: username
    });
    const promise = user.verifyEmail(options);
    return wrapCallbacks(options, promise);
  }

  static forgotUsername(email, options) {
    const user = new CoreUser({
      email: email
    });
    const promise = user.forgotUsername(options);
    return wrapCallbacks(options, promise);
  }

  static resetPassword(username, options) {
    const user = new CoreUser({
      username: username
    });
    const promise = user.resetPassword(options);
    return wrapCallbacks(options, promise);
  }

  static create(data, options) {
    return User.signup(data, options);
  }

  static update(data, options) {
    const user = new CoreUser();
    const promise = user.update(data, options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(options, promise);
  }

  static find(query, options) {
    const store = new UsersStore();
    const promise = store.find(query, options).then(users => {
      return map(users, user => {
        return user.toJSON();
      });
    });
    return wrapCallbacks(options, promise);
  }

  static get(id, options) {
    const store = new UsersStore();
    const promise = store.findById(id, options).then(user => {
      return user.toJSON();
    });
    return wrapCallbacks(options, promise);
  }

  static exists(username, options) {
    const store = new UsersStore();
    const promise = store.exists(username, options);
    return wrapCallbacks(options, promise);
  }

  static destroy(id, options) {
    const store = new UsersStore();
    const promise = store.removeById(id, options);
    return wrapCallbacks(options, promise);
  }

  static restore(id, options) {
    const store = new UsersStore();
    const promise = store.restore(id, options);
    return wrapCallbacks(options, promise);
  }

  static count(query, options) {
    const store = new UsersStore();
    const promise = store.count(query, options);
    return wrapCallbacks(options, promise);
  }

  static group(aggregation, options) {
    const store = new UsersStore();
    const promise = store.group(aggregation, options);
    return wrapCallbacks(options, promise);
  }
}
