const User = require('../core/models/user');

class LegacyUser {
  /**
   * Get the active user.
   *
   * @param   {Client}    Client
   * @return  {Promise}   Resolved with the active user null.
   */
  static getActive(client) {
    const promise = User.getActive(client).then(user => {
      if (user) {
        return user.toJSON();
      }

      return null;
    });

    return promise;
  }

  /**
   * Set the active user.
   *
   * @param   {User}      User
   * @param   {Client}    Client
   * @return  {Promise}   Resolved with the active user or null.
   */
  static setActive(user, client) {
    const promise = User.setActive(user, client).then(user => {
      if (user) {
        return user.toJSON();
      }

      return null;
    });

    return promise;
  }

  static login() {
    return User.login().then(user => {
      return user.toJSON();
    });
  }

  static logout() {
    return User.logout();
  }
}

module.exports = LegacyUser;
