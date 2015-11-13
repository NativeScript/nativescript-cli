const User = require('../core/models/user');

class LegacyUser {
  static login() {
    return User.login();
  }
}

module.exports = LegacyUser;
