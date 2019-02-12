import ActiveUserError from '../errors/activeUser';
import NotFoundError from '../errors/notFound';
import login from './login';
import * as MIC from './mic';
import signup from './signup';
import getActiveUser from './getActiveUser';

export default async function loginWithRedirectUri(redirectUri, options) {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new ActiveUserError(
      'An active user already exists. Please logout the active user before you login with Mobile Identity Connect.'
    );
  }

  const session = await MIC.loginWithRedirectUri(redirectUri, options);
  const socialIdentity = {};
  socialIdentity[MIC.IDENTITY] = session;
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
