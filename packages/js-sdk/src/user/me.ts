import { getActiveUser } from './getActiveUser';

export async function me() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.me();
  }

  return null;
}
