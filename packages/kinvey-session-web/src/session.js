import { register as _register } from 'kinvey-session';

const sessionStore = {
  get(appKey) {
    const session = window.localStorage.getItem(appKey);
    if (session) {
      return JSON.parse(session);
    }
    return null;
  },

  set(appKey, session) {
    window.localStorage.setItem(appKey, JSON.stringify(session));
    return session;
  },

  remove(appKey) {
    window.localStorage.removeItem(appKey);
    return true;
  }
};

export function register() {
  _register(sessionStore);
}

