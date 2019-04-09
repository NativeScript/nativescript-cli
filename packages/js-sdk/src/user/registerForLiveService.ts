import { getActiveUser } from './getActiveUser';

export async function registerForLiveService(options?: { timeout?: number }) {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.registerForLiveService(options);
  }

  return null;
}
