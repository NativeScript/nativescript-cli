const User = require('../core/models/user');

class LegacyUser {
  /**
   * Active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
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

  static login() {
    return User.login();
  }
}

module.exports = LegacyUser;
