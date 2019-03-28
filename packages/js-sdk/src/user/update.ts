import { getActiveUser } from './getActiveUser';

export async function update(data: any) {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.update(data);
  }

  return null;
}
