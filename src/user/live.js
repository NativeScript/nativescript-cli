export async function registerForLiveService() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.registerForLiveService();
  }

  throw new ActiveUserError('There is no active user');
}

export async function unregisterForLiveService() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.unregisterForLiveService();
  }

  throw new ActiveUserError('There is no active user');
}
