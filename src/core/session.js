import CoreObject from './object';
import utils from './utils';
import Cache from './cache';
import Entity from './entity';
import log from './logger';
const currentSession = Symbol();
const currentSessionKey = 'CurrentSession';
let authToken;

class PrivateSession extends CoreObject {
  constructor(token) {
    super();

    // Set the authToken
    authToken = token;
  }

  get authToken() {
    return authtoken;
  }
}

class Session extends CoreObject {
  static get current() {
    let session = this[currentSession];

    // Retrieve the current session from cache
    if (!utils.isDefined(session)) {
      let cachedSession = Cache.get(currentSessionKey);

      if (utils.isDefined(cachedSession)) {
        session = new PrivateSession(cachedSession);
        this[currentSession] = session;
      }
    }

    // Return the session
    return session;
  }

  static set current(user) {
    if (utils.isDefined(user)) {
      let userData = user instanceof Entity ? user.toJSON() : user;

      // Store the current session
      Cache.set(currentSessionKey, userData);

      // Create a new session
      this[currentSession] = new PrivateSession(userData);

      // Debug
      log.info(`Set user ${userData._id} as the current session.`);
    }
    else {
      // Remove the current session
      Cache.remove(currentSessionKey);

      // Set the current session to null
      this[currentSession] = null;

      // Debug
      log.info(`Removed the current session. There is no active session.`);
    }
  }
}

export default Session;
