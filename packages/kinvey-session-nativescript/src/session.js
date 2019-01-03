import { register as _register } from 'kinvey-session';
import { SecureStorage } from 'nativescript-secure-storage';

const secureStorage = new SecureStorage();

const sessionStore = {
  get(key) {
    const session = secureStorage.getSync({ key });
    if (session) {
      return JSON.parse(session);
    }
    return null;
  },

  set(key, session) {
    return secureStorage.setSync({
      key,
      value: JSON.stringify(session)
    });
  },

  remove(key) {
    return secureStorage.removeSync({ key });
  }
};

export function register() {
  _register(sessionStore);
}

