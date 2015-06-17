import CoreObject from './object';
import utils from './utils';
import Cache from './cache';
const currentSession = Symbol();
const currentSessionKey = 'CurrentSession';
let sessionUser;

class Session extends CoreObject {
  constructor(user) {
    super();

    // Set the user
    sessionUser = user;
  }

  get authToken() {
    return sessionUser._kmd.authtoken;
  }

  get user() {
    return sessionUser;
  }

  static get current() {
    let session = this[currentSession];

    // Retrieve the current session from cache
    if (!utils.isDefined(session)) {
      let cachedSession = Cache.get(currentSessionKey);

      if (utils.isDefined(cachedSession)) {
        session = new Session(cachedSession);
        this[currentSession] = session;
      }
    }

    // Return the session
    return session;
  }

  static set current(user) {
    if (utils.isDefined(user)) {
      // Store the current session
      Cache.set(currentSessionKey, user);

      // Create a new session
      this[currentSession] = new Session(user);
    }
    else {
      // Remove the current session
      Cache.remove(currentSessionKey);
      this[currentSession] = null;
    }
  }
}

export default Session;
