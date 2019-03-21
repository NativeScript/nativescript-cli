import { Base64 } from 'js-base64';
import ActiveUserError from '../errors/activeUser';

interface Session {
  _kmd?: {
    authtoken?: string
  }
}

export function app(appKey: string, appSecret: string) {
  const credentials = Base64.encode(`${appKey}:${appSecret}`);
  return `Basic ${credentials}`;
}

export function master(appKey: string, masterSecret: string) {
  const credentials = Base64.encode(`${appKey}:${masterSecret}`);
  return `Basic ${credentials}`;
}

export function session(activeSession: Session) {
  if (!activeSession || !activeSession._kmd || !activeSession._kmd.authtoken) {
    throw new ActiveUserError('There is no active user to authorize the request. Please login and retry the request.');
  }

  return `Kinvey ${activeSession._kmd.authtoken}`;
}

export function basic(appKey: string, appSecret: string, masterSecret: string) {
  try {
    return app(appKey, appSecret);
  } catch (error) {
    return master(appKey, masterSecret);
  }
}

export function defaultAuth(activeSession: Session, appKey: string, masterSecret: string) {
  try {
    return session(activeSession);
  } catch (error) {
    return master(appKey, masterSecret);
  }
}

export function all(activeSession: Session, appKey: string, appSecret: string, masterSecret: string) {
  try {
    return session(activeSession);
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
