import { Base64 } from 'js-base64';
import { ActiveUserError } from 'kinvey-errors';

export const Auth = {
  All(session, appKey, appSecret, masterSecret) {
    return function authFn() {
      try {
        return Auth.Session(session)();
      } catch (error) {
        return Auth.Basic(appKey, appSecret, masterSecret)();
      }
    };
  },
  App(appKey, appSecret) {
    return function authFn() {
      const credentials = Base64.encode(`${appKey}:${appSecret}`);
      return `Basic ${credentials}`;
    };
  },
  Basic(appKey, appSecret, masterSecret) {
    return function authFn() {
      try {
        return Auth.App(appKey, appSecret)();
      } catch (error) {
        return Auth.Master(appKey, masterSecret)();
      }
    };
  },
  Default(session, appKey, masterSecret) {
    return function authFn() {
      try {
        return Auth.Session(session)();
      } catch (error) {
        return Auth.Master(appKey, masterSecret)();
      }
    };
  },
  Master(appKey, masterSecret) {
    return function authFn() {
      const credentials = Base64.encode(`${appKey}:${masterSecret}`);
      return `Basic ${credentials}`;
    };
  },
  Session(session) {
    return function authFn() {
      if (!session || !session._kmd || !session._kmd.authtoken) {
        throw new ActiveUserError('There is no active user to authorize the request. Please login and retry the request.');
      }

      return `Kinvey ${session._kmd.authtoken}`;
    };
  },
  Client(appKey, clientId) {
    return function authFn() {
      const credentials = Base64.encode(`${appKey}:${clientId}`);
      return `Basic ${credentials}`;
    };
  }
};
