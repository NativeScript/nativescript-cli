import { getActiveUser } from './getActiveUser';

export async function logout(options?: any) {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.logout(options);
  }

  return null;
}
