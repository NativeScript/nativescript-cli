import { Base64 } from 'js-base64';
import { ActiveUserError } from 'kinvey-errors';

export function app(appKey, appSecret) {
  const credentials = Base64.encode(`${appKey}:${appSecret}`);
  return `Basic ${credentials}`;
}

export function master(appKey, masterSecret) {
  const credentials = Base64.encode(`${appKey}:${masterSecret}`);
  return `Basic ${credentials}`;
}

export function session(session) {
  if (!session || !session._kmd || !session._kmd.authtoken) {
    throw new ActiveUserError('There is no active user to authorize the request. Please login and retry the request.');
  }

  return `Kinvey ${session._kmd.authtoken}`;
}

export function basic(appKey, appSecret, masterSecret) {
  try {
    return app(appKey, appSecret);
  } catch (error) {
    return master(appKey, masterSecret);
  }
}

export function defaultAuth(_session, appKey, masterSecret) {
  try {
    return session(_session);
  } catch (error) {
    return master(appKey, masterSecret);
  }
}

export function all(_session, appKey, appSecret, masterSecret) {
  try {
    return session(_session);
  } catch (error) {
    return basic(appKey, appSecret, masterSecret);
  }
}

export const Auth = {
  All: 'All',
  App: 'App',
  Basic: 'Basic',
  Default: 'Default',
  Master: 'Master',
  Session: 'Session'
};

// Client(appKey, clientId) {
//   return function authFn() {
//     const credentials = Base64.encode(`${appKey}:${clientId}`);
//     return `Basic ${credentials}`;
//   };
// }
