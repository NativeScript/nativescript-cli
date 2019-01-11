import { getActiveUser } from './user';

export default async function logout(options) {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.logout(options);
  }

  return null;
}
