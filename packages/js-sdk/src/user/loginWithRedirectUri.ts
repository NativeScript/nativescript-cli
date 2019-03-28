import isString from 'lodash/isString';
import { ActiveUserError } from '../errors/activeUser';
import { NotFoundError } from '../errors/notFound';
import { KinveyError } from '../errors/kinvey';
import { getAppKey } from '../kinvey';
import { login } from './login';
import { loginWithPopup, getTokenWithCode } from './mic';
import { signup } from './signup';
import { getActiveUser } from './getActiveUser';

export interface MICOptions {
  micId?: string;
  version?: string | number;
  timeout?: number;
}

export async function loginWithRedirectUri(redirectUri: string, options: MICOptions = {}) {
  const activeUser = getActiveUser();
  const { micId, version } = options;
  let clientId = getAppKey();

  if (activeUser) {
    throw new ActiveUserError('An active user already exists. Please logout the active user before you login with Mobile Identity Connect.');
  }

  if (!isString(redirectUri)) {
    throw new KinveyError('A redirectUri is required and must be a string.');
  }

  if (isString(micId)) {
    clientId = `${clientId}.${micId}`;
  }

  const code = await loginWithPopup(clientId, redirectUri, version);
  const token = await getTokenWithCode(code, clientId, redirectUri, options);
  const socialIdentity = { [token.identity]: token };
  const credentials = { _socialIdentity: socialIdentity };

  try {
    return await login(credentials);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return await signup(credentials);
    }

    throw error;
  }
}
