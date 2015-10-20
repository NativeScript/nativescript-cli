import User from '../core/user';

export default class LegacyUser {
  static login() {
    const user = new User();
    return user.login();
  }
}
