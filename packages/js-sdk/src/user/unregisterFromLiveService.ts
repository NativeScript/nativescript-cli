import { getActiveUser } from './getActiveUser';

export async function unregisterFromLiveService(options?: { timeout?: number }) {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.unregisterFromLiveService(options);
  }

  return null;
}
